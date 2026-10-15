import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final firstName = user?['firstName'] as String? ?? 'there';

    return Scaffold(
      appBar: AppBar(
        title: const Text('RaphaCare'),
        actions: [
          IconButton(
            tooltip: 'Log out',
            onPressed: () => context.read<AuthProvider>().logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Welcome, $firstName!',
                style: const TextStyle(
                  color: AppTheme.heading,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Manage your pets and stay on top of their wellness.',
                style: TextStyle(color: AppTheme.muted, fontSize: 15),
              ),
              const SizedBox(height: 28),
              _HomeCard(
                icon: Icons.pets,
                title: 'My Pets',
                subtitle: 'View your pets and their profiles.',
              ),
              const SizedBox(height: 14),
              _HomeCard(
                icon: Icons.calendar_month,
                title: 'Appointments',
                subtitle: 'View and manage upcoming appointments.',
              ),
              const SizedBox(height: 14),
              _HomeCard(
                icon: Icons.description_outlined,
                title: 'Medical Records',
                subtitle: 'Keep your pets’ care information in one place.',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeCard extends StatelessWidget {
  const _HomeCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: AppTheme.primary.withValues(alpha: 0.18),
          foregroundColor: AppTheme.primaryDark,
          child: Icon(icon),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: AppTheme.heading,
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Text(subtitle),
      ),
    );
  }
}
