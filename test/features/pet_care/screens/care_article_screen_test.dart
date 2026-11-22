import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rvcare/features/pet_care/models/care_article.dart';
import 'package:rvcare/features/pet_care/screens/care_article_screen.dart';

void main() {
  testWidgets('article browser button asks before leaving the app', (
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
      MaterialApp(
        theme: ThemeData(splashFactory: NoSplash.splashFactory),
        home: CareArticleScreen(article: article),
      ),
    );
    expect(find.text('PET CARE GUIDE'), findsOneWidget);
    expect(find.text('Health'), findsOneWidget);
    await tester.tap(find.text('Open in browser'));
    await tester.pumpAndSettle();

    expect(find.text('You’re leaving RaphaCare'), findsOneWidget);
    expect(
      find.textContaining('This article opens in your browser'),
      findsOneWidget,
    );

    await tester.tap(find.text('Stay in app'));
    await tester.pumpAndSettle();

    expect(find.text('You’re leaving RaphaCare'), findsNothing);
  });
}
