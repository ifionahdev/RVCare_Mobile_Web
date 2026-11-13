import 'package:flutter/material.dart';

const _background = Color(0xFFF4F8F8);
const _heading = Color(0xFF202D3E);
const _muted = Color(0xFF718399);
const _teal = Color(0xFF078891);
const _border = Color(0xFFDCE9EC);
const _mint = Color(0xFFDFF3F0);

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final Set<int> _readNotifications = {};

  static const _notifications = [
    _Notification(
      id: 1,
      category: 'PET CARE',
      title: 'A little care, a lot of love',
      message:
          'Explore our ear-cleaning article and video guide for everyday care.',
      time: '10:30 AM',
      icon: Icons.menu_book_rounded,
    ),
    _Notification(
      id: 2,
      category: 'APPOINTMENTS',
      title: 'Appointment request received',
      message: 'Your request for Luna is in Bookings. Check there for the latest status.',
      time: '10:15 AM',
      icon: Icons.calendar_month_rounded,
    ),
    _Notification(
      id: 3,
      category: 'RECORDS',
      title: 'Keep Luna’s records handy',
      message:
          'Luna’s latest health records are ready to view in your Records.',
      time: '9:45 AM',
      icon: Icons.description_outlined,
    ),
  ];

  int get _unreadCount => _notifications.length - _readNotifications.length;

  void _markAllAsRead() {
    setState(() {
      _readNotifications.addAll(_notifications.map((item) => item.id));
    });
  }

  void _markAsRead(int id) {
    setState(() => _readNotifications.add(id));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: SizedBox(
                height: 48,
                child: Row(
                  children: [
                    Material(
                      color: Colors.white,
                      shape: const CircleBorder(),
                      child: InkWell(
                        onTap: () => Navigator.pop(context),
                        customBorder: const CircleBorder(),
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: _border, width: 1.5),
                          ),
                          child: const Icon(
                            Icons.arrow_back_rounded,
                            color: _heading,
                            size: 22,
                          ),
                        ),
                      ),
                    ),
                    const Expanded(
                      child: Text(
                        'Notifications',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _heading,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
                children: [
                  const Text(
                    'Stay in the loop',
                    style: TextStyle(
                      color: _heading,
                      fontSize: 24,
                      height: 1.1,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Care tips, appointment updates, and records for your pet.',
                    style: TextStyle(color: _muted, fontSize: 14, height: 1.4),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: _mint,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$_unreadCount unread',
                          style: const TextStyle(
                            color: _teal,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: _unreadCount == 0 ? null : _markAllAsRead,
                        style: TextButton.styleFrom(
                          foregroundColor: _teal,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                        ),
                        child: const Text(
                          'Mark all as read',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const _DateHeading('3 NOVEMBER 2026'),
                  const SizedBox(height: 12),
                  for (final notification in _notifications) ...[
                    _NotificationCard(
                      notification: notification,
                      isRead: _readNotifications.contains(notification.id),
                      onTap: () => _markAsRead(notification.id),
                    ),
                    const SizedBox(height: 12),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateHeading extends StatelessWidget {
  const _DateHeading(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: _muted,
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.6,
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.isRead,
    required this.onTap,
  });

  final _Notification notification;
  final bool isRead;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _mint,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(notification.icon, color: _teal, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.category,
                      style: const TextStyle(
                        color: _teal,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      notification.title,
                      style: const TextStyle(
                        color: _heading,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      notification.message,
                      style: const TextStyle(
                        color: _muted,
                        fontSize: 12,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${notification.time} · ${isRead ? 'Read' : 'Unread'}',
                      style: const TextStyle(color: _muted, fontSize: 10),
                    ),
                  ],
                ),
              ),
              if (!isRead) ...[
                const SizedBox(width: 8),
                const Padding(
                  padding: EdgeInsets.only(top: 5),
                  child: CircleAvatar(radius: 3, backgroundColor: _teal),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Notification {
  const _Notification({
    required this.id,
    required this.category,
    required this.title,
    required this.message,
    required this.time,
    required this.icon,
  });

  final int id;
  final String category;
  final String title;
  final String message;
  final String time;
  final IconData icon;
}
