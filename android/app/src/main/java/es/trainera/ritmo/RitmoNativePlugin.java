package es.trainera.ritmo;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Puente mínimo: la página avisa del tema (claro/oscuro) para que las barras del sistema y el fondo coincidan. */
@CapacitorPlugin(name = "RitmoNative")
public class RitmoNativePlugin extends Plugin {
    private static final int LIGHT_BG = Color.parseColor("#EDF3F4");
    private static final int DARK_BG = Color.parseColor("#08171E");

    @PluginMethod
    public void setTheme(final PluginCall call) {
        final boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        getActivity().runOnUiThread(new Runnable() {
            @Override
            @SuppressWarnings("deprecation")
            public void run() {
                int bg = dark ? DARK_BG : LIGHT_BG;
                Window w = getActivity().getWindow();
                View decor = w.getDecorView();
                decor.setBackgroundColor(bg);
                getBridge().getWebView().setBackgroundColor(bg);
                // Iconos de las barras legibles sobre el fondo elegido
                WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, decor);
                c.setAppearanceLightStatusBars(!dark);
                c.setAppearanceLightNavigationBars(!dark);
                // Antes de Android 15 el color de las barras se fija así; desde Android 15 (borde a borde) se ignora
                // y se ve el fondo de la ventana, que ya se ha teñido arriba.
                if (Build.VERSION.SDK_INT < 35) {
                    w.setStatusBarColor(bg);
                    w.setNavigationBarColor(bg);
                }
            }
        });
        call.resolve();
    }
}
