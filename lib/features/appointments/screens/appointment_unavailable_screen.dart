import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../widgets/appointment_widgets.dart';
import 'recommended_schedules_screen.dart';

class AppointmentUnavailableScreen extends StatelessWidget {
  const AppointmentUnavailableScreen({
    super.key,
    required this.pet,
    required this.procedure,
    required this.preferredDate,
    required this.preferredTime,
    required this.veterinarian,
    required this.petId,
    required this.serviceId,
    this.hasAvailableSchedules = true,
  });

  final String pet;
  final String procedure;
  final String preferredDate;
  final String preferredTime;
  final String veterinarian;
  final int petId;
  final int serviceId;
  final bool hasAvailableSchedules;

  @override
  Widget build(BuildContext context) {
    if (!hasAvailableSchedules) {
      return _NoSchedulesScreen(
        pet: pet,
        procedure: procedure,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        veterinarian: veterinarian,
        petId: petId,
        serviceId: serviceId,
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: appointmentAppBar(
        context,
        title: 'Check Availability',
        showBack: true,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            const AppointmentProgress(step: 2, label: 'Step 2 of 2'),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    Text(
                      '$preferredDate · $veterinarian',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Preferred $preferredTime · Unavailable',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF9A6A1C),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBF0),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE7D8A6)),
                      ),
                      child: const Text(
                        'Preferred time is unavailable. Tap Show Recommended Schedules to see alternatives.',
                        style: TextStyle(
                          fontSize: 16,
                          height: 1.35,
                          color: Color(0xFF6E5A35),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Recommended Appointment Schedules',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            AppointmentBottomButton(
              label: 'Show Recommended Schedules',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => RecommendedSchedulesScreen(
                    pet: pet,
                    procedure: procedure,
                    preferredDate: preferredDate,
                    preferredTime: preferredTime,
                    veterinarian: veterinarian,
                    petId: petId,
                    serviceId: serviceId,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'Choose Another Schedule',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryDark,
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

class _NoSchedulesScreen extends StatelessWidget {
  const _NoSchedulesScreen({
    required this.pet,
    required this.procedure,
    required this.preferredDate,
    required this.preferredTime,
    required this.veterinarian,
    required this.petId,
    required this.serviceId,
  });

  final String pet;
  final String procedure;
  final String preferredDate;
  final String preferredTime;
  final String veterinarian;
  final int petId;
  final int serviceId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: appointmentAppBar(
        context,
        title: 'Check Availability',
        showBack: true,
      ),
      body: Column(
        children: [
          const AppointmentProgress(step: 2, label: 'Step 2 of 2'),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$preferredDate · $veterinarian',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.heading,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Preferred $preferredTime · Unavailable',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF9A6A1C),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBF0),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE7D8A6)),
                    ),
                    child: const Text(
                      'Your preferred veterinarian has no available schedule at this time. Please try another date or veterinarian.',
                      style: TextStyle(
                        fontSize: 16,
                        height: 1.35,
                        color: Color(0xFF7B6438),
                      ),
                    ),
                  ),
                  const SizedBox(height: 54),
                  const Row(
                    children: [
                      Icon(
                        Icons.calendar_month_outlined,
                        size: 34,
                        color: AppTheme.heading,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'No Available Schedules Found',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.heading,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'We couldn’t find an available appointment. Please try another date or veterinarian.',
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.4,
                      color: AppTheme.muted,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AppointmentBottomButton(
            label: 'Choose Another Schedule',
            onTap: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}
