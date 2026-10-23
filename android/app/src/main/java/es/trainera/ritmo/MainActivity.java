package es.trainera.ritmo;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

/** Envuelve la app web (dist/app) en el WebView de Capacitor: sin conexión, vertical y con la pantalla siempre encendida. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Los plugins propios se registran antes de super.onCreate()
        registerPlugin(RitmoNativePlugin.class);
        super.onCreate(savedInstanceState);
        // Mientras el metrónomo está en pantalla, que no se apague
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
