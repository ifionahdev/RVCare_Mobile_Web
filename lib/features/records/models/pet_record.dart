enum PetRecordType { medical, laboratory }

extension PetRecordTypeLabel on PetRecordType {
  String get label => switch (this) {
    PetRecordType.medical => 'Medical',
    PetRecordType.laboratory => 'Laboratory',
  };
}

/// The pet a record belongs to (shown in the pet card and "Patient" field).
class RecordPet {
  const RecordPet({required this.name, required this.details});

  final String name;
  final String details;
}

class PetRecord {
  const PetRecord({
    required this.title,
    required this.date,
    required this.type,
    required this.pdfUrl,
    this.isNew = false,
  });

  final String title;

  /// Upload date, already formatted, e.g. 'Oct 10, 2026'.
  final String date;
  final PetRecordType type;

  /// Link to the original PDF (opened in the browser / a PDF app).
  final String pdfUrl;

  /// Laboratory reports flagged as new drive the banner on the list screen.
  final bool isNew;
}