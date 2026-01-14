package com.farmacia.santamarta.ui.client;

import android.os.Bundle;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.fragment.app.FragmentActivity;
import com.farmacia.santamarta.R;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class OrderTrackingActivity extends FragmentActivity implements OnMapReadyCallback {
    private GoogleMap mMap;
    private DatabaseReference mDatabase;
    private String orderId = "order_001"; // Ejemplo
    private Marker deliveryMarker;
    private TextView tvStatus;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_order_tracking);

        tvStatus = findViewById(R.id.tvTrackingStatus);
        mDatabase = FirebaseDatabase.getInstance().getReference();

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.mapTracking);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;
        listenToDeliveryLocation();
        listenToOrderStatus();
    }

    private void listenToDeliveryLocation() {
        mDatabase.child("tracking").child(orderId).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    Double lat = snapshot.child("lat").getValue(Double.class);
                    Double lng = snapshot.child("lng").getValue(Double.class);
                    if (lat != null && lng != null) {
                        LatLng deliveryPos = new LatLng(lat, lng);
                        updateDeliveryMarker(deliveryPos);
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void listenToOrderStatus() {
        mDatabase.child("orders").child(orderId).child("estado").addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                String status = snapshot.getValue(String.class);
                if (status != null) {
                    tvStatus.setText("Estado: " + status);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void updateDeliveryMarker(LatLng position) {
        if (deliveryMarker == null) {
            deliveryMarker = mMap.addMarker(new MarkerOptions()
                    .position(position)
                    .title("Tu Repartidor")
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)));
            mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(position, 15f));
        } else {
            deliveryMarker.setPosition(position);
        }
    }
}
