import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/auth_text_field.dart';
import '../widgets/create_account_dialog.dart';
import 'forgot_password_page.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';


class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {

  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();


  Future<void> _login() async {
    final auth = context.read<AuthProvider>();

    final success = await auth.login(
      _usernameController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    if (!success) {
      _showFrontendMessage(
        auth.error ?? 'Unable to log in. Please try again.',
      );
    }

    // Successful login automatically switches to the existing
    // home screen through the root authentication gate.
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
                          AuthTextField(
                            label: 'Username',
                            hint: 'Enter your username',
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
                              onPressed: context.watch<AuthProvider>().isLoading
                                  ? null
                                  : _login,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: AppTheme.heading,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(13),
                                ),
                              ),
                              child: context.watch<AuthProvider>().isLoading
                                  ? const Text(
                                      'Logging in...',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                    )
                                  : const Text(
                                      'Log In',
                                      style: TextStyle(
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
