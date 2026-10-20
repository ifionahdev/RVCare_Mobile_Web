import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../core/constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/auth_text_field.dart';
import 'reset_password_page.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();

  bool _loading = false;

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ),
  );

  @override
  void dispose() {
    _emailController.dispose();
    _dio.close();
    super.dispose();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _submitRequest() async {
    if (_loading) return;

    final email = _emailController.text.trim().toLowerCase();

    final emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

    if (!emailPattern.hasMatch(email)) {
      _showMessage('Please enter a valid email address.');
      return;
    }

    setState(() {
      _loading = true;
    });

    debugPrint(
      '[forgot-password] Sending request to ${ApiConstants.baseUrl}/auth/forgot-password',
    );

    try {
      await _dio.post(
        '/auth/forgot-password',
        data: {'email': email, 'platform': 'mobile'},
      );

      debugPrint('[forgot-password] Backend accepted the request.');

      if (!mounted) return;

      final resetCompleted = await Navigator.push<bool>(
        context,
        MaterialPageRoute<bool>(
          builder: (_) => ResetPasswordPage(email: email),
        ),
      );

      if (!mounted) return;

      if (resetCompleted == true) {
        Navigator.pop(context);
      }
    } on DioException catch (error) {
      debugPrint(
        '[forgot-password] Request failed: type=${error.type}, '
        'message=${error.message}, uri=${error.requestOptions.uri}, '
        'status=${error.response?.statusCode}',
      );
      if (!mounted) return;

      final data = error.response?.data;

      final message = data is Map && data['message'] is String
          ? data['message'] as String
          : 'Unable to request a code. Please try again.';

      _showMessage(message);
    } catch (_) {
      debugPrint('[forgot-password] Unexpected request failure.');
      if (!mounted) return;
      _showMessage('Something went wrong. Please try again.');
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back to login',
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back),
        ),
        title: const Text(
          'Forgot Password',
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
                        Icons.lock_reset_outlined,
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
                    'Enter the email address associated with '
                    'your RaphaCare account. We will send you '
                    'a 6-digit verification code.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppTheme.muted,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 30),
                  AuthTextField(
                    label: 'Email Address',
                    hint: 'Enter your registered email',
                    controller: _emailController,
                    email: true,
                    textInputAction: TextInputAction.done,
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submitRequest,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: AppTheme.heading,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(13),
                        ),
                      ),
                      child: Text(
                        _loading ? 'Sending...' : 'Send Code',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 15),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Back to Login',
                      style: TextStyle(color: AppTheme.primaryDark),
                    ),
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
