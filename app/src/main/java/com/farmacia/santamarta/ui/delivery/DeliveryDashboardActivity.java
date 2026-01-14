package com.farmacia.santamarta.ui.delivery;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;
import com.farmacia.santamarta.R;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

public class DeliveryDashboardActivity extends FragmentActivity implements OnMapReadyCallback {
    private GoogleMap mMap;
    private FusedLocationProviderClient fusedLocationClient;
    private DatabaseReference mDatabase;
    private String currentOrderId = "order_001"; // Ejemplo
    private String deliveryId = "delivery_001"; // Ejemplo
    private Button btnUpdateStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_delivery_dashboard);

        mDatabase = FirebaseDatabase.getInstance().getReference();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }

        btnUpdateStatus = findViewById(R.id.btnUpdateStatus);
        btnUpdateStatus.setOnClickListener(v -> updateOrderStatus("ENTREGADO"));
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;
        startLocationUpdates();
    }

    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
            return;
        }

        LocationRequest locationRequest = LocationRequest.create()
                .setInterval(5000)
                .setFastestInterval(2000)
                .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        fusedLocationClient.requestLocationUpdates(locationRequest, new LocationCallback() {
            @Override
            public void onLocationResult(@NonNull LocationResult locationResult) {
                for (Location location : locationResult.getLocations()) {
                    updateLocationInFirebase(location);
                    updateMapMarker(location);
                }
            }
        }, getMainLooper());
    }

    private void updateLocationInFirebase(Location location) {
        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());
        mDatabase.child("tracking").child(currentOrderId).child("lat").setValue(latLng.latitude);
        mDatabase.child("tracking").child(currentOrderId).child("lng").setValue(latLng.longitude);
        mDatabase.child("tracking").child(currentOrderId).child("last_update").setValue(System.currentTimeMillis());
    }

    private void updateMapMarker(Location location) {
        LatLng currentPos = new LatLng(location.getLatitude(), location.getLongitude());
        mMap.clear();
        mMap.addMarker(new MarkerOptions().position(currentPos).title("Tu ubicación"));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(currentPos, 15f));
    }

    private void updateOrderStatus(String status) {
        mDatabase.child("orders").child(currentOrderId).child("estado").setValue(status)
                .addOnSuccessListener(aVoid -> Toast.makeText(this, "Pedido actualizado a: " + status, Toast.LENGTH_SHORT).show());
    }
}
