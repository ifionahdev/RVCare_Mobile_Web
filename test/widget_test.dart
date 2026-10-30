import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

import 'package:rvcare/app.dart';
import 'package:rvcare/core/network/api_client.dart';
import 'package:rvcare/features/auth/providers/auth_provider.dart';
import 'package:rvcare/features/auth/services/auth_service.dart';

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
}
