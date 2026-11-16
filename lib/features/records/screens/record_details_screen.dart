import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/records_service.dart';
import '../models/pet_record.dart';

const _teal = Color(0xFF068A98);
const _tealDark = Color(0xFF05808A);
const _mint = Color(0xFFE0F2F1);
const _bg = Color(0xFFF5FAFA);

/// White rounded card with the pet's avatar, name and details.
class RecordPetCard extends StatelessWidget {
  const RecordPetCard({super.key, required this.pet, this.showChevron = false});

  final RecordPet pet;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
              color: _mint,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.pets_rounded, color: _teal, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pet.name,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.heading,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  pet.details,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13.5, color: AppTheme.muted),
                ),
              ],
            ),
          ),
          if (showChevron)
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 26,
              color: Color(0xFF64748B),
            ),
        ],
      ),
    );
  }
}

class RecordDetailsScreen extends StatefulWidget {
  const RecordDetailsScreen({
    super.key,
    required this.record,
    required this.pet,
    this.onBack,
  });

  final PetRecord record;
  final RecordPet pet;

  /// Optional custom back action (e.g. when a parent shell swaps screens).
  /// Defaults to popping the route.
  final VoidCallback? onBack;

  @override
  State<RecordDetailsScreen> createState() => _RecordDetailsScreenState();
}

class _RecordDetailsScreenState extends State<RecordDetailsScreen> {
  bool _isDownloading = false;

  Future<void> _downloadRecord() async {
    setState(() => _isDownloading = true);
    try {
      final saved = await context.read<RecordsService>().downloadRecord(
        widget.record,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            saved ? 'PDF saved successfully.' : 'PDF download was cancelled.',
          ),
        ),
      );
    } on DioException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(RecordsService.readableError(error))),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(RecordsService.readableError(error))),
      );
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final record = widget.record;
    final pet = widget.pet;
    final isLab = record.type == PetRecordType.laboratory;

    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                children: [
                  Row(
                    children: [
                      IconButton.outlined(
                        onPressed:
                            widget.onBack ?? () => Navigator.maybePop(context),
                        icon: const Icon(Icons.chevron_left_rounded),
                        iconSize: 28,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          fixedSize: const Size(48, 48),
                          side: const BorderSide(color: AppTheme.border),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Text(
                        'Record details',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.heading,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  RecordPetCard(pet: pet),
                  const SizedBox(height: 22),
                  Text(
                    isLab ? 'LABORATORY REPORT' : 'MEDICAL RECORD',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.3,
                      color: Color(0xFF067783),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    record.title,
                    style: const TextStyle(
                      fontSize: 32,
                      height: 1.1,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Recorded ${record.date}',
                    style: const TextStyle(fontSize: 15, color: AppTheme.muted),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _InfoField(label: 'Patient', value: pet.name),
                        ),
                        Expanded(
                          child: _InfoField(
                            label: 'Record type',
                            value: record.type.label,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _RecordSpecificDetails(record: record),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Record PDF',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.heading,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: _mint,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.description_outlined,
                                    size: 24,
                                    color: _teal,
                                  ),
                                  Text(
                                    'PDF',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: _teal,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    record.title,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.heading,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'PDF document',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Save an organized PDF of this medical or laboratory record.',
                          style: TextStyle(
                            fontSize: 15,
                            height: 1.35,
                            color: AppTheme.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Pinned bottom action
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FilledButton.icon(
                    onPressed: _isDownloading ? null : _downloadRecord,
                    icon: _isDownloading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(Icons.download_rounded, size: 24),
                    label: Text(
                      _isDownloading ? 'Preparing PDF...' : 'Download PDF',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: _tealDark,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(26),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Choose where to save your PDF',
                    style: TextStyle(fontSize: 13, color: AppTheme.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecordSpecificDetails extends StatelessWidget {
  const _RecordSpecificDetails({required this.record});

  final PetRecord record;

  @override
  Widget build(BuildContext context) {
    final details = record.details;
    final isLab = record.type == PetRecordType.laboratory;
    final hasDetails = isLab
        ? details.hasLaboratoryDetails
        : details.hasMedicalDetails;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isLab ? 'Laboratory results' : 'Medical findings',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 14),
          if (!hasDetails)
            const Text(
              'No additional details are available for this record.',
              style: TextStyle(
                fontSize: 15,
                height: 1.4,
                color: AppTheme.muted,
              ),
            )
          else if (isLab)
            _LaboratoryRecordDetails(details: details)
          else
            _MedicalRecordDetails(details: details),
        ],
      ),
    );
  }
}

class _MedicalRecordDetails extends StatelessWidget {
  const _MedicalRecordDetails({required this.details});

  final PetRecordDetails details;

  @override
  Widget build(BuildContext context) {
    final measurements = <({String label, String value})>[
      if (details.weight != null)
        (label: 'Weight (kg)', value: details.weight!),
      if (details.temperature != null)
        (label: 'Temperature', value: details.temperature!),
      if (details.heartRate != null)
        (label: 'Heart rate', value: details.heartRate!),
    ];
    final notes = <({String label, String value})>[
      if (details.findings != null)
        (label: 'Findings', value: details.findings!),
      if (details.assessment != null)
        (label: 'Assessment', value: details.assessment!),
      if (details.treatmentPlan != null)
        (label: 'Treatment plan', value: details.treatmentPlan!),
      if (details.instructions != null)
        (label: 'Instructions', value: details.instructions!),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (measurements.isNotEmpty)
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final item in measurements)
                Container(
                  constraints: const BoxConstraints(minWidth: 96),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: _bg,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.label,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.muted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.value,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.heading,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        for (var i = 0; i < notes.length; i++) ...[
          if (measurements.isNotEmpty || i > 0) const SizedBox(height: 16),
          _DetailNote(label: notes[i].label, value: notes[i].value),
        ],
      ],
    );
  }
}

class _LaboratoryRecordDetails extends StatelessWidget {
  const _LaboratoryRecordDetails({required this.details});

  final PetRecordDetails details;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (details.interpretation != null) ...[
          _DetailNote(label: 'Interpretation', value: details.interpretation!),
          if (details.results.isNotEmpty) const SizedBox(height: 16),
        ],
        for (var i = 0; i < details.results.length; i++) ...[
          if (i > 0) const Divider(height: 22),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      details.results[i].parameter,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.heading,
                      ),
                    ),
                    if (details.results[i].referenceRange.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Reference: ${details.results[i].referenceRange}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.muted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text(
                [
                  details.results[i].result.isEmpty
                      ? 'Not provided'
                      : details.results[i].result,
                  if (details.results[i].unit.isNotEmpty)
                    details.results[i].unit,
                ].join(' '),
                textAlign: TextAlign.end,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.heading,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _DetailNote extends StatelessWidget {
  const _DetailNote({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppTheme.muted,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            height: 1.4,
            color: AppTheme.heading,
          ),
        ),
      ],
    );
  }
}

class _InfoField extends StatelessWidget {
  const _InfoField({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13.5, color: AppTheme.muted),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: AppTheme.heading,
          ),
        ),
      ],
    );
  }
}
