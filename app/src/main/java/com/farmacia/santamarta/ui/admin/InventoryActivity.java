package com.farmacia.santamarta.ui.admin;

import android.os.Bundle;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import com.farmacia.santamarta.R;
import com.farmacia.santamarta.models.Product;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

public class InventoryActivity extends AppCompatActivity {
    private DatabaseReference mDatabase;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_inventory);

        mDatabase = FirebaseDatabase.getInstance().getReference();
    }

    // Método para actualizar stock después de escaneo
    private void updateProductStock(String barcode, int newStock) {
        mDatabase.child("products").child(barcode).child("stock").setValue(newStock)
            .addOnSuccessListener(aVoid -> Toast.makeText(InventoryActivity.this, "Stock actualizado", Toast.LENGTH_SHORT).show())
            .addOnFailureListener(e -> Toast.makeText(InventoryActivity.this, "Error al actualizar", Toast.LENGTH_SHORT).show());
    }
}
