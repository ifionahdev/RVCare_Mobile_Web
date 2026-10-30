import 'package:flutter/material.dart';

import 'app.dart';

import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/api_client.dart';
import 'features/auth/services/auth_service.dart';
import 'features/auth/providers/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  const storage = FlutterSecureStorage();

  final apiClient = ApiClient(storage);

  final authService = AuthService(apiClient: apiClient, storage: storage);

  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(authService)..bootstrap(),
      child: const RaphaCareApp(),
    ),
  );
}
