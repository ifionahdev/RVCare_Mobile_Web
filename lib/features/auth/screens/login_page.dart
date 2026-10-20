
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/auth_text_field.dart';
import '../providers/auth_provider.dart';
import '../widgets/create_account_dialog.dart';
import 'forgot_password_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  // Checks whether the entered value is a valid email format.
  bool _isValidEmail(String email) {
    final emailPattern = RegExp(
      r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
    );

    return emailPattern.hasMatch(email);
  }

  // Logs in using the email stored in the username database column.
  Future<void> _login() async {
    final email = _usernameController.text.trim().toLowerCase();
    final password = _passwordController.text;

    if (email.isEmpty) {
      _showFrontendMessage('Please enter your email address.');
      return;
    }

    if (!_isValidEmail(email)) {
      _showFrontendMessage('Please enter a valid email address.');
      return;
    }

    if (password.isEmpty) {
      _showFrontendMessage('Please enter your password.');
      return;
    }

    final auth = context.read<AuthProvider>();

    final success = await auth.login(
      email,
      password,
    );

    if (!mounted) return;

    if (!success) {
      _showFrontendMessage(
        auth.error ?? 'Unable to log in. Please try again.',
      );
    }

    // A successful login updates AuthProvider.
    // The root authentication gate displays the customer home page.
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _showAccountDialog() {
    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (_) => const CreateAccountDialog(),
    );
  }

  void _showFrontendMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 430),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(25, 40, 25, 25),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Center(
                            child: Image.asset(
                              'assets/images/rvcare_logo.png',
                              width: 76,
                              height: 65,
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) => const Icon(
                                Icons.pets,
                                color: AppTheme.primaryDark,
                                size: 56,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'RaphaCare',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 29,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.heading,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Your partner in premium pet wellness',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppTheme.muted,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 35),

                          // Email input
                          AuthTextField(
                            label: 'Email',
                            hint: 'Enter your email address',
                            controller: _usernameController,
                            textInputAction: TextInputAction.next,
                          ),

                          const SizedBox(height: 20),

                          Row(
                            children: [
                              const Expanded(
                                child: Text(
                                  'Password',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.heading,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute<void>(
                                      builder: (_) =>
                                          const ForgotPasswordPage(),
                                    ),
                                  );
                                },
                                style: TextButton.styleFrom(
                                  foregroundColor: AppTheme.primaryDark,
                                  padding: EdgeInsets.zero,
                                  minimumSize: const Size(0, 35),
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  'Forgot Password?',
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 8),

                          // Password input
                          AuthTextField(
                            label: '',
                            hint: 'Enter your password',
                            controller: _passwordController,
                            password: true,
                            textInputAction: TextInputAction.done,
                          ),

                          const SizedBox(height: 25),

                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              onPressed: isLoading ? null : _login,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: AppTheme.heading,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(13),
                                ),
                              ),
                              child: Text(
                                isLoading ? 'Logging in...' : 'Log In',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 30),
                          const Divider(color: AppTheme.border),
                          const SizedBox(height: 12),

                          TextButton(
                            onPressed: _showAccountDialog,
                            child: const Text(
                              'How to create an account?',
                              style: TextStyle(
                                color: AppTheme.primaryDark,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
