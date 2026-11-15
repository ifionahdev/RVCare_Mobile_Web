enum PetRecordType { medical, laboratory }

extension PetRecordTypeLabel on PetRecordType {
  String get label => switch (this) {
    PetRecordType.medical => 'Medical',
    PetRecordType.laboratory => 'Laboratory',
  };

  String get apiValue => switch (this) {
    PetRecordType.medical => 'medical',
    PetRecordType.laboratory => 'laboratory',
  };

  String get apiPathValue => switch (this) {
    PetRecordType.medical => 'medical',
    PetRecordType.laboratory => 'laboratory',
  };
}

class RecordPet {
  const RecordPet({required this.name, required this.details});

  final String name;
  final String details;
}

class PetRecord {
  const PetRecord({
    required this.id,
    required this.title,
    required this.date,
    required this.type,
    required this.pet,
  });

  final int id;
  final String title;

  /// Formatted record date, for example "Oct 10, 2026".
  final String date;
  final PetRecordType type;
  final RecordPet pet;

  String get fileName {
    final value = 'raphacare_${type.label}_${pet.name}_${title}_$date'
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
        .replaceAll(RegExp(r'^_+|_+$'), '');
    if (value.isEmpty) return 'raphacare_record_$id';
    final boundedName = value.length > 160 ? value.substring(0, 160) : value;
    return '${boundedName}_$id';
  }

  factory PetRecord.fromJson(Map<String, dynamic> json) {
    final type = switch (json['type']) {
      'medical' => PetRecordType.medical,
      'laboratory' => PetRecordType.laboratory,
      _ => throw const FormatException('The record type is invalid.'),
    };
    final petData = json['pet'];
    if (petData is! Map) {
      throw const FormatException('The record patient data is invalid.');
    }

    final recordDate = DateTime.tryParse(json['date'] as String? ?? '');
    if (recordDate == null) {
      throw const FormatException('The record date is invalid.');
    }
    final pet = Map<String, dynamic>.from(petData);

    return PetRecord(
      id: json['id'] as int,
      title: json['title'] as String,
      date: _formatRecordDate(recordDate),
      type: type,
      pet: RecordPet(
        name: pet['name'] as String,
        details: pet['details'] as String,
      ),
    );
  }
}

String _formatRecordDate(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}
