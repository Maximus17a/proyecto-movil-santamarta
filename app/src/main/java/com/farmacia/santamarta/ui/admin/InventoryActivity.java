package com.farmacia.santamarta.ui.admin;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.farmacia.santamarta.R;
import com.farmacia.santamarta.models.Product;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class InventoryActivity extends AppCompatActivity {
    private static final int PERMISSION_CAMERA_REQUEST = 1;
    private PreviewView previewView;
    private TextView tvBarcodeResult, tvProductName, tvProductPrice;
    private EditText etStock;
    private Button btnUpdateStock;
    private View cardProductDetails;
    private DatabaseReference mDatabase;
    private String currentBarcode;
    private ExecutorService cameraExecutor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_inventory);

        previewView = findViewById(R.id.previewView);
        tvBarcodeResult = findViewById(R.id.tvBarcodeResult);
        tvProductName = findViewById(R.id.tvProductName);
        tvProductPrice = findViewById(R.id.tvProductPrice);
        etStock = findViewById(R.id.etStock);
        btnUpdateStock = findViewById(R.id.btnUpdateStock);
        cardProductDetails = findViewById(R.id.cardProductDetails);

        mDatabase = FirebaseDatabase.getInstance().getReference();
        cameraExecutor = Executors.newSingleThreadExecutor();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, PERMISSION_CAMERA_REQUEST);
        }

        btnUpdateStock.setOnClickListener(v -> {
            if (currentBarcode != null) {
                String stockStr = etStock.getText().toString();
                if (!stockStr.isEmpty()) {
                    int newStock = Integer.parseInt(stockStr);
                    updateProductStock(currentBarcode, newStock);
                }
            }
        });
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindCameraUseCases(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                Log.e("InventoryActivity", "Error al iniciar cámara", e);
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCameraUseCases(@NonNull ProcessCameraProvider cameraProvider) {
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        BarcodeScanner scanner = BarcodeScanning.getClient();
        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        imageAnalysis.setAnalyzer(cameraExecutor, image -> {
            @SuppressWarnings("UnsafeOptInUsageError")
            InputImage inputImage = InputImage.fromMediaImage(image.getImage(), image.getImageInfo().getRotationDegrees());
            scanner.process(inputImage)
                    .addOnSuccessListener(barcodes -> {
                        for (Barcode barcode : barcodes) {
                            String rawValue = barcode.getRawValue();
                            if (rawValue != null && !rawValue.equals(currentBarcode)) {
                                currentBarcode = rawValue;
                                runOnUiThread(() -> loadProductData(currentBarcode));
                            }
                        }
                    })
                    .addOnCompleteListener(task -> image.close());
        });

        CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;
        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis);
    }

    private void loadProductData(String barcode) {
        tvBarcodeResult.setText("Código: " + barcode);
        mDatabase.child("products").child(barcode).addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    Product product = snapshot.getValue(Product.class);
                    if (product != null) {
                        tvProductName.setText(product.getNombre());
                        tvProductPrice.setText("Precio: ₡" + product.getPrecio());
                        etStock.setText(String.valueOf(product.getStock()));
                        cardProductDetails.setVisibility(View.VISIBLE);
                    }
                } else {
                    Toast.makeText(InventoryActivity.this, "Producto no encontrado", Toast.LENGTH_SHORT).show();
                    cardProductDetails.setVisibility(View.GONE);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e("InventoryActivity", "Error en Firebase", error.toException());
            }
        });
    }

    private void updateProductStock(String barcode, int newStock) {
        mDatabase.child("products").child(barcode).child("stock").setValue(newStock)
                .addOnSuccessListener(aVoid -> Toast.makeText(InventoryActivity.this, "Stock actualizado correctamente", Toast.LENGTH_SHORT).show())
                .addOnFailureListener(e -> Toast.makeText(InventoryActivity.this, "Error al actualizar", Toast.LENGTH_SHORT).show());
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cameraExecutor.shutdown();
    }
}
