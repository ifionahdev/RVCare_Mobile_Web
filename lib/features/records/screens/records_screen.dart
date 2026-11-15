import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/records_service.dart';
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
  late Future<List<PetRecord>> _recordsFuture;
  _RecordFilter _filter = _RecordFilter.all;
  final Set<String> _downloadingRecords = {};

  @override
  void initState() {
    super.initState();
    _recordsFuture = context.read<RecordsService>().fetchMyRecords();
  }

  void _openRecord(PetRecord record) {
    final callback = widget.onOpenRecord;
    if (callback != null) {
      callback(record);
      return;
    }
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => RecordDetailsScreen(record: record, pet: record.pet),
      ),
    );
  }

  String _downloadKey(PetRecord record) =>
      '${record.type.apiValue}-${record.id}';

  Future<void> _download(PetRecord record) async {
    final key = _downloadKey(record);
    if (_downloadingRecords.contains(key)) return;
    setState(() => _downloadingRecords.add(key));
    try {
      final saved = await context.read<RecordsService>().downloadRecord(record);
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
      if (mounted) setState(() => _downloadingRecords.remove(key));
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: FutureBuilder<List<PetRecord>>(
        future: _recordsFuture,
        builder: (context, snapshot) {
          final records = snapshot.data ?? const <PetRecord>[];
          final visible = records.where(_filter.matches).toList();
          final labCount = records
              .where((record) => record.type == PetRecordType.laboratory)
              .length;

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            children: [
              const Text(
                'Records',
                style: TextStyle(
                  fontSize: 34,
                  height: 1.05,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.heading,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Medical and laboratory records for your pets.',
                style: TextStyle(fontSize: 14, color: AppTheme.muted),
              ),
              const SizedBox(height: 18),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _RecordFilter.values.map((filter) {
                    final selected = filter == _filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: ChoiceChip(
                        label: Text(filter.label),
                        selected: selected,
                        onSelected: (_) => setState(() => _filter = filter),
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
                          color: selected
                              ? Colors.white
                              : const Color(0xFF536568),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              if (snapshot.connectionState == ConnectionState.waiting)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (snapshot.hasError)
                _RecordsLoadError(
                  message: RecordsService.readableError(snapshot.error!),
                  onRetry: () => setState(
                    () => _recordsFuture = context
                        .read<RecordsService>()
                        .fetchMyRecords(),
                  ),
                )
              else ...[
                if (labCount > 0) ...[
                  const SizedBox(height: 14),
                  _LaboratoryBanner(
                    count: labCount,
                    onTap: () =>
                        setState(() => _filter = _RecordFilter.laboratory),
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
                    isDownloading: _downloadingRecords.contains(
                      _downloadKey(visible[i]),
                    ),
                    onView: () => _openRecord(visible[i]),
                    onDownload: () => _download(visible[i]),
                  ),
                ],
              ],
            ],
          );
        },
      ),
    );
  }
}

class _RecordsLoadError extends StatelessWidget {
  const _RecordsLoadError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30),
      child: Column(
        children: [
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
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
        ? '1 laboratory report is available'
        : '$count laboratory reports are available';

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
    required this.isDownloading,
    required this.onView,
    required this.onDownload,
  });

  final PetRecord record;
  final bool isDownloading;
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
            'Recorded ${record.date}',
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
              const Icon(Icons.pets_outlined, size: 17, color: AppTheme.muted),
              const SizedBox(width: 6),
              Text(
                record.pet.name,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.heading,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  record.pet.details,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                ),
              ),
            ],
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
                onPressed: isDownloading ? null : onDownload,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.heading,
                  minimumSize: const Size(62, 40),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  side: const BorderSide(color: AppTheme.border),
                  shape: const StadiumBorder(),
                ),
                child: isDownloading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'Download',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
