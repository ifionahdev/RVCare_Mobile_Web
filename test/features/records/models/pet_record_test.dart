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

    expect(record.id, 42);
    expect(record.type, PetRecordType.laboratory);
    expect(record.date, 'Nov 12, 2026');
    expect(record.pet.name, 'Luna');
    expect(record.type.apiPathValue, 'laboratory');
    expect(record.fileName, contains('_42'));
    expect(
      record.details.interpretation,
      'Results are within expected ranges.',
    );
    expect(record.details.results.single.parameter, 'Hemoglobin');
    expect(record.details.results.single.result, '14');
  });

  test('maps medical measurements and notes from the backend response', () {
    final record = PetRecord.fromJson({
      'id': 7,
      'type': 'medical',
      'title': 'Wellness exam',
      'date': '2026-11-12',
      'pet': {'name': 'Luna', 'details': 'Golden Retriever · Dog'},
      'details': {
        'weight': '24.5',
        'temperature': '38.2',
        'heartRate': '90',
        'findings': 'Healthy.',
      },
    });

    expect(record.details.weight, '24.5');
    expect(record.details.temperature, '38.2');
    expect(record.details.heartRate, '90');
    expect(record.details.findings, 'Healthy.');
    expect(record.details.hasMedicalDetails, isTrue);
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
