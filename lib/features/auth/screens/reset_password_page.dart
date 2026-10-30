import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../core/constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/auth_text_field.dart';
import 'password_updated_page.dart';

class ResetPasswordPage extends StatefulWidget {
  const ResetPasswordPage({
    super.key,
    required this.email,
    required this.verificationToken,
  });
  final String email;
  final String verificationToken;

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _updatePassword() async {
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;
    String? message;
    if (password.length < 12) {
      message = 'Password must contain at least 12 characters.';
    } else if (password != confirmPassword) {
      message = 'Passwords do not match.';
    }
    if (message != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
      return;
    }
    setState(() => _loading = true);
    final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
    try {
      await dio.post(
        '/auth/reset-password',
        data: {
          'email': widget.email,
          'platform': 'mobile',
          'verificationToken': widget.verificationToken,
          'password': password,
        },
      );
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.pushReplacement<void, void>(
        context,
        MaterialPageRoute<void>(builder: (_) => const PasswordUpdatedPage()),
      );
    } on DioException catch (error) {
      final data = error.response?.data;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              data is Map && data['message'] is String
                  ? data['message'] as String
                  : 'Unable to update the password. Please try again.',
            ),
          ),
        );
        setState(() => _loading = false);
      }
    } finally {
      dio.close();
    }
  }

  Widget _requirement(String text, {required bool valid}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(
        children: [
          Icon(
            valid ? Icons.check_circle : Icons.check_circle_outline,
            size: 16,
            color: valid ? AppTheme.primaryDark : AppTheme.muted,
          ),
          const SizedBox(width: 7),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              color: valid ? AppTheme.heading : AppTheme.muted,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final password = _passwordController.text;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back),
        ),
        title: const Text(
          'Change Password',
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
                    const SizedBox(height: 5),
                    Text(
                      'Your email is verified. Create a new password for\nyour account:',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 11,
                        height: 1.5,
                        color: AppTheme.muted,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.email,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 18),
                    AuthTextField(
                      label: 'New Password',
                      hint: 'New Password',
                      controller: _passwordController,
                      password: true,
                      textInputAction: TextInputAction.next,
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 14),
                    AuthTextField(
                      label: 'Confirm Password',
                      hint: 'Confirm Password',
                      controller: _confirmPasswordController,
                      password: true,
                      textInputAction: TextInputAction.done,
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'PASSWORD MUST HAVE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 10),
                    StatefulBuilder(
                      builder: (context, setRequirements) {
                        return Column(
                          children: [
                            _requirement(
                              'At least 12 characters',
                              valid: password.length >= 12,
                            ),
                            _requirement(
                              'At least one number',
                              valid: password.contains(RegExp(r'[0-9]')),
                            ),
                            _requirement(
                              'Both uppercase and lowercase',
                              valid:
                                  password.contains(RegExp(r'[a-z]')) &&
                                  password.contains(RegExp(r'[A-Z]')),
                            ),
                            _requirement(
                              'At least one special character',
                              valid: password.contains(RegExp(r'[^A-Za-z0-9]')),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 80),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _updatePassword,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryDark,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          _loading ? 'Updating...' : 'Update Password',
                          style: const TextStyle(fontWeight: FontWeight.w700),
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
