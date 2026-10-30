import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class AppointmentConfirmationScreen extends StatelessWidget {
  const AppointmentConfirmationScreen({
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

  void _backToHome(BuildContext context) {
    Navigator.popUntil(context, (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    const reference = 'APT-20261104-01';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 52,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDFFFF0),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Container(
                        width: 68,
                        height: 68,
                        decoration: const BoxDecoration(
                          color: Color(0xFF2BB673),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          size: 46,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 34),
                    const Text(
                      'Booking Confirmed!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        height: 1.05,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      "Your reservation has been successfully\nfinalized. We'll remind you the day before.\nSee you soon!",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15,
                        height: 1.35,
                        color: AppTheme.muted,
                      ),
                    ),
                    const SizedBox(height: 34),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDFEFE),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFFD9DEE1),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          const Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'APPOINTMENT DETAILS',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                                color: AppTheme.muted,
                              ),
                            ),
                          ),
                          const SizedBox(height: 22),
                          _ConfirmationDetail(
                            label: 'Pet Name',
                            value: pet,
                            valueFontWeight: FontWeight.w700,
                          ),
                          _ConfirmationDetail(
                            label: 'Procedure Type',
                            value: procedure,
                            chip: true,
                          ),
                          _ConfirmationDetail(
                            label: 'Date & Time',
                            value: '$date · $time',
                            wrap: true,
                          ),
                          _ConfirmationDetail(
                            label: 'Assigned Vet',
                            value: veterinarian,
                            wrap: true,
                          ),
                          _ConfirmationDetail(
                            label: 'Reference',
                            value: reference,
                            valueStyle: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.heading,
                            ),
                            wrap: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () => _backToHome(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryDark,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text(
                          'View My Appointments',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () => _backToHome(context),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppTheme.heading,
                          side: const BorderSide(
                            color: Color(0xFFD9DEE1),
                            width: 1.2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text(
                          'Back to Home',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ConfirmationDetail extends StatelessWidget {
  const _ConfirmationDetail({
    required this.label,
    required this.value,
    this.chip = false,
    this.wrap = false,
    this.valueFontWeight,
    this.valueStyle,
  });

  final String label;
  final String value;
  final bool chip;
  final bool wrap;
  final FontWeight? valueFontWeight;
  final TextStyle? valueStyle;

  @override
  Widget build(BuildContext context) {
    final valueWidget = chip
        ? Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: const Color(0xFFE4F6F8),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppTheme.primaryDark,
              ),
            ),
          )
        : Text(
            value,
            textAlign: wrap ? TextAlign.right : null,
            style:
                valueStyle ??
                TextStyle(
                  fontSize: 14,
                  fontWeight: valueFontWeight ?? FontWeight.w700,
                  color: AppTheme.heading,
                ),
          );

    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                height: 1.25,
                color: AppTheme.muted,
              ),
            ),
          ),
          const SizedBox(width: 12),
          if (wrap) Flexible(flex: 2, child: valueWidget) else valueWidget,
        ],
      ),
    );
  }
}
