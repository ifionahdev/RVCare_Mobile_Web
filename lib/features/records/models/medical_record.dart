enum MedicalRecordType { visit, vaccine }

class MedicalRecord {
  const MedicalRecord({
    required this.date,
    required this.title,
    required this.description,
    required this.veterinarian,
    required this.type,
  });

  final String date;
  final String title;
  final String description;
  final String veterinarian;
  final MedicalRecordType type;
}
