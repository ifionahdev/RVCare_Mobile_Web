import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../widgets/appointment_widgets.dart';
import 'appointment_confirmation_screen.dart';

class AppointmentSummaryScreen extends StatelessWidget {
  const AppointmentSummaryScreen({
    super.key,
    required this.pet,
    required this.procedure,
    required this.veterinarian,
    required this.time,
    required this.date,
  });

  final String pet;
  final String procedure;
  final String veterinarian;
  final String time;
  final String date;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: appointmentAppBar(
        context,
        title: 'Booking Summary',
        showBack: true,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Review your appointment',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please check the details before confirming your booking.',
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.45,
                        color: AppTheme.muted,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Column(
                        children: [
                          _SummaryRow(label: 'Pet', value: pet),
                          const Divider(height: 28),
                          _SummaryRow(
                            label: 'Procedure',
                            value: procedure,
                            valueIsChip: true,
                          ),
                          const Divider(height: 28),
                          _SummaryRow(label: 'Date', value: date),
                          const Divider(height: 28),
                          _SummaryRow(label: 'Time', value: time),
                          const Divider(height: 28),
                          _SummaryRow(
                            label: 'Veterinarian',
                            value: veterinarian,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const _SummaryNotice(),
                  ],
                ),
              ),
            ),
            AppointmentBottomButton(
              label: 'Confirm Booking',
              margin: 20,
              onTap: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => AppointmentConfirmationScreen(
                    pet: pet,
                    procedure: procedure,
                    veterinarian: veterinarian,
                    time: time,
                    date: date,
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueIsChip = false,
  });

  final String label;
  final String value;
  final bool valueIsChip;

  @override
  Widget build(BuildContext context) {
    final valueWidget = valueIsChip
        ? Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFE5F6F8),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.primaryDark,
              ),
            ),
          )
        : Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppTheme.heading,
            ),
          );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
        ),
        const SizedBox(width: 12),
        Flexible(flex: 2, child: valueWidget),
      ],
    );
  }
}

class _SummaryNotice extends StatelessWidget {
  const _SummaryNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF2FBFC),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 20, color: AppTheme.primaryDark),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'You can change this appointment from My Appointments.',
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppTheme.heading,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
