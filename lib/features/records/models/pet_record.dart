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

class LabRecordResult {
  const LabRecordResult({
    required this.parameter,
    required this.result,
    required this.unit,
    required this.referenceRange,
  });

  final String parameter;
  final String result;
  final String unit;
  final String referenceRange;

  factory LabRecordResult.fromJson(Map<String, dynamic> json) {
    return LabRecordResult(
      parameter: _recordText(json['parameter']) ?? '',
      result: _recordText(json['result']) ?? '',
      unit: _recordText(json['unit']) ?? '',
      referenceRange: _recordText(json['referenceRange']) ?? '',
    );
  }
}

class PetRecordDetails {
  const PetRecordDetails({
    this.weight,
    this.temperature,
    this.heartRate,
    this.findings,
    this.assessment,
    this.treatmentPlan,
    this.instructions,
    this.interpretation,
    this.results = const [],
  });

  final String? weight;
  final String? temperature;
  final String? heartRate;
  final String? findings;
  final String? assessment;
  final String? treatmentPlan;
  final String? instructions;
  final String? interpretation;
  final List<LabRecordResult> results;

  bool get hasMedicalDetails =>
      weight != null ||
      temperature != null ||
      heartRate != null ||
      findings != null ||
      assessment != null ||
      treatmentPlan != null ||
      instructions != null;

  bool get hasLaboratoryDetails => interpretation != null || results.isNotEmpty;

  factory PetRecordDetails.fromJson(Map<String, dynamic> json) {
    final rawResults = json['results'];
    if (rawResults != null && rawResults is! List) {
      throw const FormatException('The laboratory results are invalid.');
    }

    return PetRecordDetails(
      weight: _recordText(json['weight']),
      temperature: _recordText(json['temperature']),
      heartRate: _recordText(json['heartRate']),
      findings: _recordText(json['findings']),
      assessment: _recordText(json['assessment']),
      treatmentPlan: _recordText(json['treatmentPlan']),
      instructions: _recordText(json['instructions']),
      interpretation: _recordText(json['interpretation']),
      results: [
        for (final entry in rawResults as List? ?? const [])
          if (entry is Map)
            LabRecordResult.fromJson(Map<String, dynamic>.from(entry))
          else
            throw const FormatException('A laboratory result is invalid.'),
      ],
    );
  }
}

class PetRecord {
  const PetRecord({
    required this.id,
    required this.title,
    required this.date,
    required this.type,
    required this.pet,
    this.details = const PetRecordDetails(),
  });

  final int id;
  final String title;

  /// Formatted record date, for example "Oct 10, 2026".
  final String date;
  final PetRecordType type;
  final RecordPet pet;
  final PetRecordDetails details;

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
    final rawDetails = json['details'];
    if (rawDetails != null && rawDetails is! Map) {
      throw const FormatException('The record details are invalid.');
    }

    return PetRecord(
      id: json['id'] as int,
      title: json['title'] as String,
      date: _formatRecordDate(recordDate),
      type: type,
      pet: RecordPet(
        name: pet['name'] as String,
        details: pet['details'] as String,
      ),
      details: PetRecordDetails.fromJson(
        rawDetails == null ? const {} : Map<String, dynamic>.from(rawDetails),
      ),
    );
  }
}

String? _recordText(dynamic value) {
  if (value == null) return null;
  if (value is! String && value is! num) {
    throw const FormatException('A record detail value is invalid.');
  }
  final text = value.toString().trim();
  return text.isEmpty ? null : text;
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
