import 'package:flutter_test/flutter_test.dart';
import 'package:rvcare/features/records/models/pet_record.dart';

void main() {
  test('maps a laboratory record from the backend response', () {
    final record = PetRecord.fromJson({
      'id': 42,
      'type': 'laboratory',
      'title': 'Complete Blood Count',
      'date': '2026-11-12',
      'pet': {'name': 'Luna', 'details': 'Golden Retriever · Dog'},
    });

    expect(record.id, 42);
    expect(record.type, PetRecordType.laboratory);
    expect(record.date, 'Nov 12, 2026');
    expect(record.pet.name, 'Luna');
    expect(record.type.apiPathValue, 'laboratory');
    expect(record.fileName, contains('_42'));
  });

  test('rejects unknown record types', () {
    expect(
      () => PetRecord.fromJson({
        'id': 1,
        'type': 'unknown',
        'title': 'Record',
        'date': '2026-11-12',
        'pet': {'name': 'Luna', 'details': 'Dog'},
      }),
      throwsFormatException,
    );
  });
}
