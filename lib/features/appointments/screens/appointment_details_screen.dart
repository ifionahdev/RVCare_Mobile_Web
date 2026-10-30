import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import 'reschedule_appointment_screen.dart';

class AppointmentDetailsScreen extends StatelessWidget {
  const AppointmentDetailsScreen({
    super.key,
    required this.date,
    required this.procedure,
    required this.pet,
    required this.time,
    required this.veterinarian,
    required this.status,
    this.reference,
  });

  final String date;
  final String procedure;
  final String pet;
  final String time;
  final String veterinarian;
  final String status;

  /// Optional booking reference, e.g. APT-20261104-01.
  final String? reference;

  // Shared with MyAppointmentsScreen so both screens look consistent.
  static const Color _pageBg = Color(0xFFF4F9FC);
  static const Color _divider = Color(0xFFE9EEF2);
  static const Color _confirmedGreen = Color(0xFF1B7F3B);
  static const Color _confirmedBg = Color(0xFFE6F6EC);
  static const Color _pendingOrange = Color(0xFFB8400F);
  static const Color _pendingBg = Color(0xFFFDEDE4);
  static const Color _chipTealBg = Color(0xFFDDF1F5);

  Future<void> _cancelAppointment(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Cancel appointment?'),
        content: const Text(
          'Are you sure you want to cancel this appointment?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Keep Appointment'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPast = status == 'Completed';

    return Scaffold(
      backgroundColor: _pageBg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
          children: [
            _buildTopBar(context),
            const SizedBox(height: 20),
            _buildHeroCard(isPast),
            if (!isPast) ...[const SizedBox(height: 12), _buildReminder()],
            const SizedBox(height: 12),
            _buildDetailsCard(),
            if (!isPast) ...[
              const SizedBox(height: 20),
              _buildActions(context),
            ],
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- top bar

  Widget _buildTopBar(BuildContext context) {
    return SizedBox(
      height: 40,
      child: Row(
        children: [
          _circleButton(
            icon: Icons.arrow_back,
            onTap: () => Navigator.maybePop(context),
          ),
          const Expanded(
            child: Text(
              'Appointment Details',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.heading,
              ),
            ),
          ),
          _circleButton(
            icon: Icons.more_horiz,
            onTap: () {
              // TODO: show appointment options.
            },
          ),
        ],
      ),
    );
  }

  Widget _circleButton({required IconData icon, required VoidCallback onTap}) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(side: BorderSide(color: AppTheme.border)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 20, color: AppTheme.heading),
        ),
      ),
    );
  }

  // -------------------------------------------------------------- hero card

  Widget _buildHeroCard(bool isPast) {
    final (chipBg, chipFg) = _statusColors(status, onDark: true);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
      decoration: BoxDecoration(
        color: AppTheme.primaryDark,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  isPast ? 'PAST APPOINTMENT' : 'UPCOMING APPOINTMENT',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: Colors.white,
                  ),
                ),
              ),
              _chip(status, chipBg, chipFg),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '$date · $time',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              height: 1.15,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$procedure for $pet · $veterinarian',
            style: const TextStyle(fontSize: 13, color: Colors.white),
          ),
        ],
      ),
    );
  }

  // --------------------------------------------------------------- reminder

  Widget _buildReminder() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE0F2F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFE3EA)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.notifications_none_rounded,
            size: 20,
            color: AppTheme.primaryDark,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Reminder: ',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  TextSpan(text: "We'll notify you the day before your visit."),
                ],
              ),
              style: TextStyle(
                fontSize: 13,
                height: 1.35,
                color: AppTheme.heading,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------- details card

  Widget _buildDetailsCard() {
    final (statusBg, statusFg) = _statusColors(status);

    final rows = <Widget>[
      _detailRow('Pet Name', valueText: pet),
      _detailRow(
        'Procedure Type',
        valueWidget: _chip(procedure, _chipTealBg, AppTheme.primaryDark),
      ),
      _detailRow('Date & Time', valueText: '$date · $time'),
      _detailRow('Assigned Vet', valueText: veterinarian),
      _detailRow('Status', valueWidget: _chip(status, statusBg, statusFg)),
      if (reference != null) _detailRow('Reference', valueText: reference),
    ];

    final children = <Widget>[
      const Text(
        'APPOINTMENT DETAILS',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          color: AppTheme.muted,
        ),
      ),
      const SizedBox(height: 4),
    ];
    for (var i = 0; i < rows.length; i++) {
      children.add(rows[i]);
      if (i != rows.length - 1) {
        children.add(Container(height: 1, color: _divider));
      }
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _detailRow(String label, {String? valueText, Widget? valueWidget}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, color: AppTheme.muted),
          ),
          const SizedBox(width: 12),
          Flexible(
            child:
                valueWidget ??
                Text(
                  valueText ?? '',
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.heading,
                  ),
                ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String text, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }

  /// Status chip colors, matching the chips on MyAppointmentsScreen.
  (Color, Color) _statusColors(String status, {bool onDark = false}) {
    if (onDark) return (Colors.white, _confirmedGreen);
    switch (status) {
      case 'Confirmed':
        return (_confirmedBg, _confirmedGreen);
      case 'Pending':
        return (_pendingBg, _pendingOrange);
      default:
        return (const Color(0xFFEEF1F3), AppTheme.muted);
    }
  }

  // ---------------------------------------------------------------- actions

  Widget _buildActions(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => RescheduleAppointmentScreen(
                    date: date,
                    procedure: procedure,
                    pet: pet,
                    time: time,
                    veterinarian: veterinarian,
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryDark,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Reschedule Appointment',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: () => _cancelAppointment(context),
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFFC62828),
              side: const BorderSide(color: Color(0xFFF0C4C4)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Cancel Appointment',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    );
  }
}
