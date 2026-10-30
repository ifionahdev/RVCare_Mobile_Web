import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class LaboratoryReportScreen extends StatelessWidget {
  const LaboratoryReportScreen({super.key});

  static const _teal = Color(0xFF068A98);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          children: [
            _TopBar(),
            const SizedBox(height: 22),
            _ReportSummary(),
            const SizedBox(height: 20),
            _ResultsTable(),
            const SizedBox(height: 20),
            _ReferenceNotice(),
            const SizedBox(height: 28),
            SizedBox(
              height: 64,
              child: ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('PDF download will be available soon.'),
                    ),
                  );
                },
                icon: const Icon(Icons.download_rounded, size: 27),
                label: const Text(
                  'Download PDF',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _teal,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _CircleButton(
          icon: Icons.arrow_back_rounded,
          onTap: () => Navigator.maybePop(context),
        ),
        const Expanded(
          child: Text(
            'Laboratory Report',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
        ),
        _CircleButton(icon: Icons.more_horiz_rounded, onTap: () {}),
      ],
    );
  }
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(side: BorderSide(color: AppTheme.border)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 52,
          height: 52,
          child: Icon(icon, size: 27, color: AppTheme.heading),
        ),
      ),
    );
  }
}

class _ReportSummary extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 22, 20, 22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: Text(
                  'Complete Blood Count\n(CBC)',
                  style: TextStyle(
                    fontSize: 20,
                    height: 1.12,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.heading,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFE3F6E8),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Text(
                  'RELEASED',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF23833E),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'LAB-24912 · For Luna',
            style: TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
          const SizedBox(height: 20),
          const Row(
            children: [
              Icon(
                Icons.calendar_today_outlined,
                size: 21,
                color: Color(0xFF718096),
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Oct 12, 2026',
                  style: TextStyle(fontSize: 13, color: AppTheme.muted),
                ),
              ),
              Expanded(
                child: Text(
                  'Dr. Rachel Carter',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontSize: 13, color: AppTheme.muted),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ResultsTable extends StatelessWidget {
  static const _rows = [
    ('WBC', '8.4', '6.0 - 17.0'),
    ('RBC', '6.8', '5.5 - 8.5'),
    ('Hemoglobin', '15.2', '12.0 - 18.0'),
    ('Hematocrit', '45%', '37 - 55%'),
    ('Platelets', '310', '200 - 500'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.border),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 22, 24, 12),
        child: Column(
          children: [
            const Row(
              children: [
                Expanded(flex: 5, child: Text('TEST', style: _headerStyle)),
                Expanded(
                  flex: 4,
                  child: Text(
                    'RESULT',
                    textAlign: TextAlign.center,
                    style: _headerStyle,
                  ),
                ),
                Expanded(
                  flex: 4,
                  child: Text(
                    'RANGE',
                    textAlign: TextAlign.right,
                    style: _headerStyle,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            for (var index = 0; index < _rows.length; index++) ...[
              if (index > 0) const Divider(height: 1, color: Color(0xFFE6EBEF)),
              SizedBox(
                height: 74,
                child: Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: Text(
                        _rows[index].$1,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 4,
                      child: Text(
                        _rows[index].$2,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 4,
                      child: Text(
                        _rows[index].$3,
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.muted,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static const _headerStyle = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.8,
    color: AppTheme.muted,
  );
}

class _ReferenceNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        color: const Color(0xFFEFFAFB),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFAADFE5)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, size: 28, color: Color(0xFF068A98)),
          SizedBox(width: 14),
          Expanded(
            child: Text(
              'All values fall within the reference range. Please contact the clinic if you have questions about this result.',
              style: TextStyle(
                fontSize: 14,
                height: 1.35,
                color: AppTheme.heading,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
