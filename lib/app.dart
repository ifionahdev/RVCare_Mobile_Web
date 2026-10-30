import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_page.dart';
import 'shared/widgets/app_shell.dart';

class RaphaCareApp extends StatelessWidget {
  const RaphaCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RaphaCare',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: AuthGate(authenticatedBuilder: (_) => const AppShell()),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key, required this.authenticatedBuilder});

  final WidgetBuilder authenticatedBuilder;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    switch (auth.status) {
      case AuthStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case AuthStatus.authenticated:
        return authenticatedBuilder(context);
      case AuthStatus.unauthenticated:
        return const LoginPage();
    }
  }
}
