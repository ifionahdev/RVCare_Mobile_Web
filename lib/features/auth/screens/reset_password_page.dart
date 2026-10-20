import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/auth_text_field.dart';

class ResetPasswordPage extends StatefulWidget {
  const ResetPasswordPage({super.key, required this.email});

  final String email;

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _loading = false;
  bool _resending = false;
  bool _verifying = false;
  String? _verificationToken;

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ),
  );

  @override
  void dispose() {
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _dio.close();
    super.dispose();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  String _messageFromError(Object error, {required String fallback}) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] is String) {
        return data['message'] as String;
      }
    }

    return fallback;
  }

  Future<void> _resetPassword() async {
    if (_loading) return;

    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (_verificationToken == null) {
      _showMessage('Please verify the code before setting a new password.');
      return;
    }

    if (password.length < 12 || password.length > 128) {
      _showMessage('Password must contain 12 to 128 characters.');
      return;
    }

    if (password != confirmPassword) {
      _showMessage('Passwords do not match.');
      return;
    }

    setState(() {
      _loading = true;
    });

    try {
      await _dio.post(
        '/auth/reset-password',
        data: {
          'email': widget.email,
          'platform': 'mobile',
          'verificationToken': _verificationToken,
          'password': password,
        },
      );

      if (!mounted) return;

      _showMessage('Password updated successfully. Please log in.');
      Navigator.pop(context, true);
    } catch (error) {
      if (!mounted) return;
      _showMessage(
        _messageFromError(
          error,
          fallback: 'Unable to reset your password. Please try again.',
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _verifyCode() async {
    if (_verifying) return;

    final otp = _otpController.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(otp)) {
      _showMessage('Please enter the 6-digit verification code.');
      return;
    }

    setState(() {
      _verifying = true;
    });

    try {
      final response = await _dio.post(
        '/auth/verify-reset-code',
        data: {'email': widget.email, 'platform': 'mobile', 'otp': otp},
      );

      final data = response.data as Map;
      final token = data['verificationToken'];
      if (token is! String || token.isEmpty) {
        throw StateError('Verification token was not returned.');
      }

      if (!mounted) return;
      setState(() {
        _verificationToken = token;
      });
      _showMessage('Code verified. You can now set a new password.');
    } catch (error) {
      if (!mounted) return;
      _showMessage(
        _messageFromError(error, fallback: 'Unable to verify the code.'),
      );
    } finally {
      if (mounted) {
        setState(() {
          _verifying = false;
        });
      }
    }
  }

  Future<void> _resendCode() async {
    if (_resending || widget.email.isEmpty) return;

    setState(() {
      _resending = true;
    });

    try {
      await _dio.post(
        '/auth/forgot-password',
        data: {'email': widget.email, 'platform': 'mobile'},
      );

      if (!mounted) return;
      _showMessage(
        'If the account is registered, a code will be sent. '
        'Please wait at least 60 seconds between requests.',
      );
    } catch (error) {
      if (!mounted) return;
      _showMessage(
        _messageFromError(
          error,
          fallback: 'Unable to request another code. Please try again.',
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _resending = false;
        });
      }
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
          'Reset Password',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(25),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.22),
                        borderRadius: BorderRadius.circular(23),
                      ),
                      child: const Icon(
                        Icons.verified_user_outlined,
                        color: AppTheme.primaryDark,
                        size: 38,
                      ),
                    ),
                  ),
                  const SizedBox(height: 25),
                  const Text(
                    'Reset your password',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.heading,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Enter the 6-digit code sent to your email and '
                    'create a new password.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppTheme.muted,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    widget.email.isEmpty
                        ? 'No email address was provided.'
                        : widget.email,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppTheme.heading,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 28),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.next,
                    maxLength: 6,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Verification Code',
                      hintText: 'Enter 6-digit code',
                      prefixIcon: Icon(Icons.shield_outlined),
                      counterText: '',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: _verifying || _verificationToken != null
                        ? null
                        : _verifyCode,
                    child: Text(
                      _verificationToken != null
                          ? 'Code verified'
                          : _verifying
                          ? 'Verifying...'
                          : 'Verify code',
                    ),
                  ),
                  const SizedBox(height: 20),
                  AuthTextField(
                    label: 'New Password',
                    hint: 'At least 12 characters',
                    controller: _passwordController,
                    password: true,
                    enabled: _verificationToken != null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 20),
                  AuthTextField(
                    label: 'Confirm New Password',
                    hint: 'Confirm your new password',
                    controller: _confirmPasswordController,
                    password: true,
                    enabled: _verificationToken != null,
                    textInputAction: TextInputAction.done,
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed:
                          _loading ||
                              widget.email.isEmpty ||
                              _verificationToken == null
                          ? null
                          : _resetPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: AppTheme.heading,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(13),
                        ),
                      ),
                      child: Text(
                        _loading ? 'Updating...' : 'Reset Password',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 15),
                  TextButton(
                    onPressed: _resending ? null : _resendCode,
                    child: Text(
                      _resending ? 'Requesting...' : 'Resend Code',
                      style: const TextStyle(color: AppTheme.primaryDark),
                    ),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Back to Login'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
