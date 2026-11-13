import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

import 'package:rvcare/app.dart';
import 'package:rvcare/core/network/api_client.dart';
import 'package:rvcare/features/auth/providers/auth_provider.dart';
import 'package:rvcare/features/auth/services/auth_service.dart';
import 'package:rvcare/features/notifications/screens/notifications_screen.dart';

void main() {
  testWidgets('renders the login screen', (WidgetTester tester) async {
    const storage = FlutterSecureStorage();
    final apiClient = ApiClient(storage);
    final authService = AuthService(apiClient: apiClient, storage: storage);

    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(authService),
        child: const RaphaCareApp(),
      ),
    );

    expect(find.text('RaphaCare'), findsOneWidget);
    expect(find.text('Your partner in premium pet wellness'), findsOneWidget);
    expect(find.text('Log In'), findsOneWidget);
  });

  testWidgets('marking notifications as read updates their unread state', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(splashFactory: NoSplash.splashFactory),
        home: const NotificationsScreen(),
      ),
    );

    expect(find.text('3 unread'), findsOneWidget);
    await tester.tap(find.text('Mark all as read'));
    await tester.pumpAndSettle();

    expect(find.text('0 unread'), findsOneWidget);
    expect(find.text('10:30 AM · Read'), findsOneWidget);
  });
}
