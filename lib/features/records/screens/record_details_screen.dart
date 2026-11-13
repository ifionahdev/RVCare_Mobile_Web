import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../models/pet_record.dart';

const _teal = Color(0xFF068A98);
const _tealDark = Color(0xFF05808A);
const _mint = Color(0xFFE0F2F1);
const _bg = Color(0xFFF5FAFA);

/// Asks "You're leaving Raphacare", then opens the record's PDF externally.
/// Used by both the list screen (Download) and the details screen.
Future<void> confirmAndOpenPdf(
  BuildContext context,
  PetRecord record,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black54,
    builder: (dialogContext) => _LeavingPdfDialog(
      record: record,
      onContinue: () => Navigator.pop(dialogContext, true),
      onStay: () => Navigator.pop(dialogContext, false),
    ),
  );
  if (confirmed != true) return;

  final ok = await launchUrl(
    Uri.parse(record.pdfUrl),
    mode: LaunchMode.externalApplication,
  );
  if (!ok && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open the PDF.')),
    );
  }
}

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

class RecordDetailsScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
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
                        onPressed: onBack ?? () => Navigator.maybePop(context),
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
                    'Uploaded ${record.date}',
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
                          'Original document',
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
                          'Download the original PDF to view the complete record.',
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
                    onPressed: () => confirmAndOpenPdf(context, record),
                    icon: const Icon(Icons.download_rounded, size: 24),
                    label: const Text(
                      'Download PDF',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
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
                    'Opens in your browser or PDF app',
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

class _LeavingPdfDialog extends StatelessWidget {
  const _LeavingPdfDialog({
    required this.record,
    required this.onContinue,
    required this.onStay,
  });

  final PetRecord record;
  final VoidCallback onContinue;
  final VoidCallback onStay;

  @override
  Widget build(BuildContext context) {
    // Brand name as shown in the design.
    const appName = 'Raphacare';

    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(34)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(26, 30, 26, 26),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: _mint,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.description_outlined,
                size: 28,
                color: _teal,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'You’re leaving $appName',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppTheme.heading,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'This PDF will open in your browser or another app that supports PDF files.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, height: 1.4, color: AppTheme.muted),
            ),
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF2F8F8),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                children: [
                  Text(
                    record.title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'PDF · Uploaded ${record.date}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: onContinue,
              style: FilledButton.styleFrom(
                backgroundColor: _tealDark,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'Open PDF',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: onStay,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.heading,
                minimumSize: const Size.fromHeight(52),
                side: const BorderSide(color: AppTheme.border, width: 2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'Stay in app',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}