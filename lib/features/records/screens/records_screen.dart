import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/pet_record.dart';
import 'record_details_screen.dart';

const _teal = Color(0xFF068A98);

enum _RecordFilter {
  all('All'),
  medical('Medical'),
  laboratory('Laboratory');

  const _RecordFilter(this.label);
  final String label;

  bool matches(PetRecord r) => switch (this) {
    _RecordFilter.all => true,
    _RecordFilter.medical => r.type == PetRecordType.medical,
    _RecordFilter.laboratory => r.type == PetRecordType.laboratory,
  };
}

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key, this.onOpenRecord});

  /// Optional: lets a parent shell (e.g. one that keeps the bottom nav bar)
  /// show the details itself. When null, the details screen is pushed as a
  /// normal route.
  final ValueChanged<PetRecord>? onOpenRecord;

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  static const _pet = RecordPet(
    name: 'Luna',
    details: 'Golden Retriever · 2 yrs, 4 mos',
  );

  // TODO: replace the placeholder PDF links with the real files.
  static const _records = [
    PetRecord(
      title: 'Mild Ear Infection',
      date: 'Oct 10, 2026',
      type: PetRecordType.medical,
      pdfUrl: 'https://rvcare.example/records/mild-ear-infection.pdf',
    ),
    PetRecord(
      title: 'Annual Rabies Vaccination',
      date: 'Sep 22, 2026',
      type: PetRecordType.medical,
      pdfUrl: 'https://rvcare.example/records/annual-rabies-vaccination.pdf',
    ),
    PetRecord(
      title: 'Complete Blood Count (CBC)',
      date: 'Oct 12, 2026',
      type: PetRecordType.laboratory,
      pdfUrl: 'https://rvcare.example/records/cbc.pdf',
      isNew: true,
    ),
    // Sample entry so the banner reads "2 new laboratory reports".
    PetRecord(
      title: 'Urinalysis',
      date: 'Oct 12, 2026',
      type: PetRecordType.laboratory,
      pdfUrl: 'https://rvcare.example/records/urinalysis.pdf',
      isNew: true,
    ),
  ];

  _RecordFilter _filter = _RecordFilter.all;

  int get _newLabCount => _records
      .where((r) => r.type == PetRecordType.laboratory && r.isNew)
      .length;

  void _openRecord(PetRecord record) {
    final callback = widget.onOpenRecord;
    if (callback != null) {
      callback(record);
      return;
    }
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => RecordDetailsScreen(record: record, pet: _pet),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final visible = _records.where(_filter.matches).toList();

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        children: [
          const Text(
            'Record',
            style: TextStyle(
              fontSize: 34,
              height: 1.05,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Uploaded files for ${_pet.name}',
            style: const TextStyle(fontSize: 14, color: AppTheme.muted),
          ),
          const SizedBox(height: 18),
          const RecordPetCard(pet: _pet, showChevron: true),
          const SizedBox(height: 18),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _RecordFilter.values.map((f) {
                final selected = f == _filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: ChoiceChip(
                    label: Text(f.label),
                    selected: selected,
                    onSelected: (_) => setState(() => _filter = f),
                    selectedColor: _teal,
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: AppTheme.border),
                    showCheckmark: false,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    labelStyle: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : const Color(0xFF536568),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          if (_newLabCount > 0) ...[
            const SizedBox(height: 14),
            _LaboratoryBanner(
              count: _newLabCount,
              onTap: () => setState(() => _filter = _RecordFilter.laboratory),
            ),
          ],
          const SizedBox(height: 16),
          if (visible.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Text(
                  'No records yet.',
                  style: TextStyle(color: AppTheme.muted),
                ),
              ),
            ),
          for (var i = 0; i < visible.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            _RecordCard(
              record: visible[i],
              onView: () => _openRecord(visible[i]),
              onDownload: () => confirmAndOpenPdf(context, visible[i]),
            ),
          ],
        ],
      ),
    );
  }
}

class _LaboratoryBanner extends StatelessWidget {
  const _LaboratoryBanner({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = count == 1
        ? '1 new laboratory report is available'
        : '$count new laboratory reports are available';

    return Material(
      color: const Color(0xFFE0F2F6),
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFB8E8EC)),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF5ADBE8),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.science_outlined,
                  size: 20,
                  color: Color(0xFF052D32),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.2,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.heading,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: _teal, size: 26),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecordCard extends StatelessWidget {
  const _RecordCard({
    required this.record,
    required this.onView,
    required this.onDownload,
  });

  final PetRecord record;
  final VoidCallback onView;
  final VoidCallback onDownload;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Uploaded ${record.date}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Color(0xFF067783),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            record.title,
            style: const TextStyle(
              fontSize: 16,
              height: 1.15,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              FilledButton(
                onPressed: onView,
                style: FilledButton.styleFrom(
                  backgroundColor: _teal,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(62, 40),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  shape: const StadiumBorder(),
                ),
                child: const Text(
                  'View',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton(
                onPressed: onDownload,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.heading,
                  minimumSize: const Size(62, 40),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  side: const BorderSide(color: AppTheme.border),
                  shape: const StadiumBorder(),
                ),
                child: const Text(
                  'Download',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}