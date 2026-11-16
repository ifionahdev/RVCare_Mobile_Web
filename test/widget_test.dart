import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

import 'package:rvcare/app.dart';
import 'package:rvcare/core/network/api_client.dart';
import 'package:rvcare/features/auth/providers/auth_provider.dart';
import 'package:rvcare/features/auth/services/auth_service.dart';
import 'package:rvcare/features/notifications/data/notifications_service.dart';
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
    final service = _FakeNotificationsService();
    await tester.pumpWidget(
      Provider<NotificationsService>.value(
        value: service,
        child: MaterialApp(
          theme: ThemeData(splashFactory: NoSplash.splashFactory),
          home: const NotificationsScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('3 unread'), findsOneWidget);
    await tester.tap(find.text('Mark all as read'));
    await tester.pumpAndSettle();

    expect(find.text('0 unread'), findsOneWidget);
    expect(find.text('10:30 AM · Read'), findsOneWidget);
  });
}

class _FakeNotificationsService extends NotificationsService {
  _FakeNotificationsService() : super(ApiClient(const FlutterSecureStorage()));

  List<AppNotification> notifications = [
    for (var index = 0; index < 3; index++)
      AppNotification(
        id: index + 1,
        category: 'appointments',
        title: 'Appointment request received',
        message: 'Your appointment request is in Bookings.',
        createdAt: DateTime(2026, 11, 3, 10, 30 - index),
        readAt: null,
      ),
  ];

  @override
  Future<List<AppNotification>> fetchMyNotifications() async => notifications;

  @override
  Future<void> markAllRead() async {
    notifications = notifications.map((item) => item.markRead()).toList();
  }
}
