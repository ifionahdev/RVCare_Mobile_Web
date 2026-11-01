import 'package:flutter/material.dart';

import 'app.dart';

import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/network/api_client.dart';
import 'core/network/realtime_provider.dart';
import 'features/auth/services/auth_service.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/appointments/data/appointment_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  const storage = FlutterSecureStorage();

  final apiClient = ApiClient(storage);

  final authService = AuthService(apiClient: apiClient, storage: storage);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(authService)..bootstrap(),
        ),
        Provider(create: (_) => AppointmentService(apiClient)),
        ChangeNotifierProvider(create: (_) => RealtimeProvider(storage)),
      ],
      child: const RaphaCareApp(),
    ),
  );
}
