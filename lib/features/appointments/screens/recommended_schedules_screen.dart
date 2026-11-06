import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../widgets/appointment_widgets.dart';
import 'appointment_summary_screen.dart';

class RecommendedSchedulesScreen extends StatefulWidget {
  const RecommendedSchedulesScreen({
    super.key,
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
  State<RecommendedSchedulesScreen> createState() =>
      _RecommendedSchedulesScreenState();
}

class _RecommendedSchedulesScreenState
    extends State<RecommendedSchedulesScreen> {
  int _selected = 0;

  final _schedules = const [
    _RecommendedSchedule(
      label: 'Closest Available Time',
      date: 'Wed, Nov 4, 2026',
      time: '11:00 AM - 12:00 PM',
      veterinarian: 'Dr. Rachel Carter',
    ),
    _RecommendedSchedule(
      date: 'Wed, Nov 4, 2026',
      time: '3:00 PM - 4:00 PM',
      veterinarian: 'Dr. Alan Mercer',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final selectedSchedule = _schedules[_selected];

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
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  Text(
                    '${widget.preferredDate} · ${widget.veterinarian}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Preferred ${widget.preferredTime} · Unavailable',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF9A6A1C),
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
                      'Your preferred time is unavailable. Here are the closest available schedules.',
                      style: TextStyle(
                        fontSize: 16,
                        height: 1.35,
                        color: Color(0xFF7B6438),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Suggested Appointment Schedules',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(_schedules.length, (index) {
                    final schedule = _schedules[index];
                    final selected = index == _selected;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: InkWell(
                        onTap: () => setState(() => _selected = index),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.fromLTRB(28, 22, 20, 22),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: selected
                                  ? AppTheme.primaryDark
                                  : AppTheme.border,
                              width: selected ? 3 : 1.5,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (schedule.label != null)
                                      Text(
                                        schedule.label!,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.primaryDark,
                                        ),
                                      ),
                                    if (schedule.label != null)
                                      const SizedBox(height: 12),
                                    Text(
                                      schedule.date,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.heading,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      schedule.time,
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.primaryDark,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      schedule.veterinarian,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        color: AppTheme.muted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              _ScheduleRadio(selected: selected),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
            child: Text(
              '${selectedSchedule.date} · ${selectedSchedule.time}',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.primaryDark,
              ),
            ),
          ),
          AppointmentBottomButton(
            label: 'Continue with Selected Time',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => AppointmentSummaryScreen(
                  pet: widget.pet,
                  procedure: widget.procedure,
                  veterinarian: selectedSchedule.veterinarian,
                  time: selectedSchedule.time.split(' - ').first,
                  date: selectedSchedule.date,
                  petId: widget.petId,
                  serviceId: widget.serviceId,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
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
    );
  }
}

class _ScheduleRadio extends StatelessWidget {
  const _ScheduleRadio({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: selected ? AppTheme.primaryDark : AppTheme.muted,
          width: 2,
        ),
      ),
      child: selected
          ? const Center(
              child: CircleAvatar(
                radius: 7,
                backgroundColor: AppTheme.primaryDark,
              ),
            )
          : null,
    );
  }
}

class _RecommendedSchedule {
  const _RecommendedSchedule({
    this.label,
    required this.date,
    required this.time,
    required this.veterinarian,
  });

  final String? label;
  final String date;
  final String time;
  final String veterinarian;
}
