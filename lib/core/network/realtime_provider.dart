import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

import 'constants.dart';

class RealtimeProvider extends ChangeNotifier {
  RealtimeProvider(this.storage);

  final FlutterSecureStorage storage;
  socket_io.Socket? _socket;
  int _revision = 0;
  bool _connected = false;

  int get revision => _revision;
  bool get connected => _connected;

  Future<void> connect() async {
    if (_socket != null) return;

    final token = await storage.read(key: 'raphacare_token');
    if (token == null || token.isEmpty) return;

    final socket = socket_io.io(
      ApiConstants.socketUrl,
      socket_io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    socket
      ..onConnect((_) {
        _connected = true;
        notifyListeners();
      })
      ..onDisconnect((_) {
        _connected = false;
        notifyListeners();
      })
      ..on('appointment:changed', (_) {
        _revision++;
        notifyListeners();
      });

    _socket = socket;
    socket.connect();
  }

  Future<void> disconnect() async {
    _socket?.dispose();
    _socket = null;
    _connected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _socket?.dispose();
    super.dispose();
  }
}
