import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/medical_record.dart';

class MedicalRecordsScreen extends StatefulWidget {
  const MedicalRecordsScreen({super.key, this.onLaboratoryReportTap});

  final VoidCallback? onLaboratoryReportTap;

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  static const _records = [
    MedicalRecord(
      date: 'Oct 10, 2026',
      title: 'Mild Ear Infection',
      description:
          'Prescribed Otomax ear drops (5 drops daily). Clean ears weekly.',
      veterinarian: 'Dr. Rachel Carter',
      type: MedicalRecordType.visit,
    ),
    MedicalRecord(
      date: 'Sep 22, 2026',
      title: 'Annual Rabies Vaccination',
      description: 'DHPP booster and rabies vaccine administered.',
      veterinarian: 'Dr. Rachel Carter',
      type: MedicalRecordType.vaccine,
    ),
  ];

  int _filter = 0;

  @override
  Widget build(BuildContext context) {
    final visibleRecords = _filter == 0
        ? _records
        : _records.where((record) => record.type.index == _filter - 1).toList();

    return SafeArea(
      top: true,
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        children: [
          const Text(
            'Medical Records',
            style: TextStyle(
              fontSize: 20,
              height: 1.05,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Visit history released by the clinic',
            style: TextStyle(fontSize: 14, color: AppTheme.muted, height: 1.3),
          ),
          const SizedBox(height: 22),
          _PetSelector(),
          const SizedBox(height: 22),
          _RecordFilters(
            selectedIndex: _filter,
            onSelected: (index) => setState(() => _filter = index),
          ),
          const SizedBox(height: 20),
          _LaboratoryBanner(onTap: widget.onLaboratoryReportTap),
          const SizedBox(height: 18),
          for (var index = 0; index < visibleRecords.length; index++) ...[
            if (index > 0) const SizedBox(height: 18),
            _TimelineCard(record: visibleRecords[index]),
          ],
        ],
      ),
    );
  }
}

class _PetSelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 76,
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Color(0xFFEFF4F3),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.pets_rounded, color: Color(0xFF068A98)),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Luna',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.heading,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Golden Retriever · 2 yrs, 4 mos',
                  style: TextStyle(fontSize: 13, color: AppTheme.muted),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 24,
            color: Color(0xFF64748B),
          ),
        ],
      ),
    );
  }
}

class _RecordFilters extends StatelessWidget {
  const _RecordFilters({required this.selectedIndex, required this.onSelected});

  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    const labels = ['All', 'Visits', 'Vaccines'];
    return Row(
      children: [
        for (var index = 0; index < labels.length; index++) ...[
          if (index > 0) const SizedBox(width: 12),
          Expanded(
            child: Material(
              color: selectedIndex == index
                  ? const Color(0xFF068A98)
                  : Colors.white,
              borderRadius: BorderRadius.circular(30),
              child: InkWell(
                onTap: () => onSelected(index),
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: selectedIndex == index
                          ? const Color(0xFF068A98)
                          : AppTheme.border,
                    ),
                  ),
                  child: Text(
                    labels[index],
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: selectedIndex == index
                          ? Colors.white
                          : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _LaboratoryBanner extends StatelessWidget {
  const _LaboratoryBanner({required this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFEAF9FC),
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFB8E8EC)),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF65D9E7),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(
                  Icons.science_outlined,
                  color: Color(0xFF052D32),
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Text(
                  '2 new laboratory reports are available',
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.2,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.heading,
                  ),
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF068A98),
                size: 30,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.record});

  final MedicalRecord record;

  @override
  Widget build(BuildContext context) {
    final isVisit = record.type == MedicalRecordType.visit;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 20, 18, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                record.date,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF068A98),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isVisit
                      ? const Color(0xFFDFF3F7)
                      : const Color(0xFFE1F7E7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isVisit ? 'Visit' : 'Vaccine',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isVisit
                        ? const Color(0xFF067783)
                        : const Color(0xFF16803A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            record.title,
            style: const TextStyle(
              fontSize: 18,
              height: 1.15,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            record.description,
            style: const TextStyle(
              fontSize: 14,
              height: 1.35,
              color: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            record.veterinarian,
            style: const TextStyle(fontSize: 14, color: AppTheme.muted),
          ),
        ],
      ),
    );
  }
}
