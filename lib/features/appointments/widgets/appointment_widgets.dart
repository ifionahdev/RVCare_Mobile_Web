import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

PreferredSizeWidget appointmentAppBar(
  BuildContext context, {
  required String title,
  required bool showBack,
}) {
  return AppBar(
    backgroundColor: Colors.white,
    foregroundColor: AppTheme.heading,
    scrolledUnderElevation: 0,
    leadingWidth: 54,
    leading: showBack
        ? Padding(
            padding: const EdgeInsets.only(left: 10),
            child: IconButton(
              onPressed: () => Navigator.maybePop(context),
              style: IconButton.styleFrom(
                side: const BorderSide(color: AppTheme.border),
              ),
              icon: const Icon(Icons.arrow_back, size: 21),
            ),
          )
        : null,
    title: Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        color: AppTheme.heading,
      ),
    ),
    centerTitle: true,
    actions: [
      Padding(
        padding: const EdgeInsets.only(right: 10),
        child: IconButton(
          onPressed: () {},
          style: IconButton.styleFrom(
            side: const BorderSide(color: AppTheme.border),
          ),
          icon: const Icon(Icons.more_horiz, size: 21),
        ),
      ),
    ],
  );
}

class AppointmentSectionLabel extends StatelessWidget {
  const AppointmentSectionLabel(this.label, {super.key});
  final String label;
  @override
  Widget build(BuildContext context) => Text(
    label,
    style: const TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: Color(0xFF687886),
    ),
  );
}

class AppointmentProgress extends StatelessWidget {
  const AppointmentProgress({
    super.key,
    required this.step,
    required this.label,
  });
  final int step;
  final String label;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
    child: Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: step / 2,
              minHeight: 8,
              backgroundColor: const Color(0xFFE9EDF0),
              color: AppTheme.primaryDark,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppTheme.muted,
          ),
        ),
      ],
    ),
  );
}

class AppointmentBottomButton extends StatelessWidget {
  const AppointmentBottomButton({
    super.key,
    required this.label,
    required this.onTap,
    this.margin = 20,
  });
  final String label;
  final VoidCallback? onTap;
  final double margin;
  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(margin, 12, margin, 16),
    child: SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryDark,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
      ),
    ),
  );
}

class AppointmentDetailRow extends StatelessWidget {
  const AppointmentDetailRow({
    super.key,
    required this.label,
    required this.value,
  });
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Expanded(
        flex: 2,
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppTheme.muted,
          ),
        ),
      ),
      Expanded(
        flex: 3,
        child: Text(
          value,
          textAlign: TextAlign.right,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppTheme.heading,
          ),
        ),
      ),
    ],
  );
}
