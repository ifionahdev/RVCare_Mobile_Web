import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/network/constants.dart';
import '../../../core/theme/app_theme.dart';
import 'reset_password_page.dart';

class VerificationCodePage extends StatefulWidget {
  const VerificationCodePage({super.key, required this.email});

  final String email;

  @override
  State<VerificationCodePage> createState() => _VerificationCodePageState();
}

class _VerificationCodePageState extends State<VerificationCodePage> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  Timer? _resendTimer;
  int _resendSeconds = 60;
  bool _resending = false;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  void _startResendTimer() {
    _resendTimer?.cancel();
    _resendSeconds = 60;
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_resendSeconds == 0) {
        _resendTimer?.cancel();
        return;
      }
      setState(() => _resendSeconds--);
    });
  }

  Future<void> _resendCode() async {
    if (_resending || _resendSeconds > 0) return;
    setState(() => _resending = true);
    final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
    try {
      await dio.post(
        '/auth/forgot-password',
        data: {'email': widget.email, 'platform': 'mobile'},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('A new verification code was sent.')),
        );
        _startResendTimer();
      }
    } on DioException catch (error) {
      final data = error.response?.data;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              data is Map && data['message'] is String
                  ? data['message'] as String
                  : 'Unable to resend the verification code.',
            ),
          ),
        );
      }
    } finally {
      dio.close();
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((controller) => controller.text).join();

  bool _verifying = false;

  String get _resendCountdown {
    final minutes = _resendSeconds ~/ 60;
    final seconds = (_resendSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _verify() async {
    if (_verifying) return;
    if (_code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter the 6-digit verification code.'),
        ),
      );
      return;
    }

    setState(() => _verifying = true);
    final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
    try {
      final response = await dio.post(
        '/auth/verify-reset-code',
        data: {'email': widget.email, 'platform': 'mobile', 'otp': _code},
      );
      final verificationToken = response.data['verificationToken'] as String?;
      if (verificationToken == null || verificationToken.isEmpty) {
        throw Exception('Verification token was not returned.');
      }
      if (!mounted) return;
      Navigator.pushReplacement<void, void>(
        context,
        MaterialPageRoute<void>(
          builder: (_) => ResetPasswordPage(
            email: widget.email,
            verificationToken: verificationToken,
          ),
        ),
      );
    } on DioException catch (error) {
      final data = error.response?.data;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              data is Map && data['message'] is String
                  ? data['message'] as String
                  : 'Unable to verify the code. Please try again.',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to verify the code. Please try again.'),
          ),
        );
      }
    } finally {
      dio.close();
      if (mounted) setState(() => _verifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back),
        ),
        title: const Text(
          'Verify Code',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 16),
                    Center(
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDF8FA),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.verified_user_outlined,
                          color: AppTheme.primaryDark,
                          size: 31,
                        ),
                      ),
                    ),
                    const SizedBox(height: 22),
                    const Text(
                      'Enter the code',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text.rich(
                      TextSpan(
                        style: const TextStyle(
                          fontSize: 12,
                          height: 1.5,
                          color: AppTheme.muted,
                        ),
                        children: [
                          const TextSpan(text: 'We sent a 6-digit code to\n'),
                          TextSpan(
                            text: widget.email,
                            style: const TextStyle(
                              color: AppTheme.heading,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(6, (index) {
                        return Container(
                          width: 46,
                          height: 52,
                          margin: EdgeInsets.only(left: index == 0 ? 0 : 10),
                          child: TextField(
                            controller: _controllers[index],
                            focusNode: _focusNodes[index],
                            textAlign: TextAlign.center,
                            keyboardType: TextInputType.number,
                            maxLength: 1,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            decoration: InputDecoration(
                              counterText: '',
                              contentPadding: EdgeInsets.zero,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onChanged: (value) {
                              if (value.isNotEmpty && index < 5) {
                                _focusNodes[index + 1].requestFocus();
                              }
                              if (value.isEmpty && index > 0) {
                                _focusNodes[index - 1].requestFocus();
                              }
                            },
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 18),
                    if (_resendSeconds > 0)
                      Text(
                        'Resend code in $_resendCountdown',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.muted,
                        ),
                      )
                    else
                      TextButton(
                        onPressed: _resending ? null : _resendCode,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: const Size(0, 24),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          _resending ? 'Resending...' : 'Resend Code',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.primaryDark,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    const SizedBox(height: 80),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _verifying ? null : _verify,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryDark,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          _verifying ? 'Verifying...' : 'Verify Code',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'Use a different email',
                        style: TextStyle(
                          color: AppTheme.primaryDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
