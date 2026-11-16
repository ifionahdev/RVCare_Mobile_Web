import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rvcare/features/records/models/pet_record.dart';
import 'package:rvcare/features/records/screens/record_details_screen.dart';

void main() {
  testWidgets('laboratory details show results from the selected record', (
    WidgetTester tester,
  ) async {
    final record = PetRecord.fromJson({
      'id': 42,
      'type': 'laboratory',
      'title': 'Complete Blood Count',
      'date': '2026-11-12',
      'pet': {'name': 'Luna', 'details': 'Golden Retriever · Dog'},
      'details': {
        'interpretation': 'Results are within expected ranges.',
        'results': [
          {
            'parameter': 'Hemoglobin',
            'result': '14',
            'unit': 'g/dL',
            'referenceRange': '12-18',
          },
        ],
      },
    });

    await tester.pumpWidget(
      MaterialApp(
        home: RecordDetailsScreen(record: record, pet: record.pet),
      ),
    );

    expect(find.text('Hemoglobin'), findsOneWidget);
    expect(find.text('14 g/dL'), findsOneWidget);
    expect(find.text('Reference: 12-18'), findsOneWidget);
    expect(find.text('Results are within expected ranges.'), findsOneWidget);
  });
}
