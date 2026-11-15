import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:rvcare/core/network/api_client.dart';
import 'package:rvcare/features/pet_care/data/pet_care_service.dart';
import 'package:rvcare/features/pet_care/models/care_article.dart';
import 'package:rvcare/features/pet_care/screens/pet_care_screen.dart';

class _FakePetCareService extends PetCareService {
  _FakePetCareService(this.articles)
    : super(ApiClient(const FlutterSecureStorage()));

  final List<CareArticle> articles;

  @override
  Future<List<CareArticle>> fetchContent() async => articles;
}

void main() {
  testWidgets('article cards show their reading source', (
    WidgetTester tester,
  ) async {
    final article = CareArticle.fromJson({
      'type': 'article',
      'title': 'Daily hydration',
      'category': 'Health',
      'shortDescription': 'Keep fresh water available.',
      'detailedContent': 'Refresh the water daily.',
      'url': 'https://www.example.com/pet-hydration',
      'icon': 'heart',
    });

    await tester.pumpWidget(
      Provider<PetCareService>(
        create: (_) => _FakePetCareService([article]),
        child: const MaterialApp(home: Scaffold(body: PetCareScreen())),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Read on example.com'), findsNWidgets(2));
  });
}
