import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundProduct, setFoundProduct] = useState(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const response = await axios.get(`/api/products`);
      const products = response.data.products;
      
      const product = products.find(p => p.sku.toLowerCase() === data.toLowerCase() || p.id === data);

      if (product) {
        setFoundProduct(product);
      } else {
        Alert.alert('Not Found', `No product found with barcode: ${data}`);
        setScanned(false);
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to search for product.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ FIX: Camera is now completely separate and uses absoluteFill */}
      <CameraView 
        style={StyleSheet.absoluteFill} 
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_e', 'upc_a', 'code128', 'code39'] }}
      />

      {/* ✅ FIX: UI Overlay is layered on top using absolute positioning */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        
        {/* Scanning Box */}
        <View style={styles.centerBox}>
          <View style={styles.unfocusedBox} />
          <View style={styles.focusedBox} />
        </View>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButtonSmall} onPress={() => navigation.goBack()}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.instructionText}>Point camera at a barcode</Text>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Searching database...</Text>
          </View>
        )}
      </View>

      {/* Product Found Modal */}
      <Modal visible={!!foundProduct} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✅ Product Found!</Text>
            
            <View style={styles.productDetail}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{foundProduct?.name}</Text>
            </View>
            <View style={styles.productDetail}>
              <Text style={styles.detailLabel}>SKU:</Text>
              <Text style={styles.detailValue}>{foundProduct?.sku}</Text>
            </View>
            <View style={styles.productDetail}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>${Number(foundProduct?.price).toFixed(2)}</Text>
            </View>
            <View style={styles.productDetail}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={[
                styles.detailValue, 
                foundProduct?.quantity <= 5 ? { color: '#ef4444' } : { color: '#10b981' }
              ]}>
                {foundProduct?.quantity} units
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => {
                setFoundProduct(null);
                setScanned(false);
              }}
            >
              <Text style={styles.modalButtonText}>Scan Another</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.closeModalButton]} 
              onPress={() => {
                setFoundProduct(null);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' },
  message: { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 20 },
  
  // ✅ FIX: Overlay Container
  overlayContainer: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  centerBox: { justifyContent: 'center', alignItems: 'center' },
  unfocusedBox: { width: 250, height: 250, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16 },
  focusedBox: { position: 'absolute', width: 250, height: 250, borderWidth: 4, borderColor: '#2563eb', borderRadius: 16 },
  
  topBar: { 
    position: 'absolute', 
    top: 60, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 20 
  },
  closeButtonSmall: { 
    position: 'absolute', 
    left: 20, 
    width: 40, 
    height: 40, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  closeIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  instructionText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600', 
    textShadowColor: 'rgba(0,0,0,0.75)', 
    textShadowOffset: {width: 0, height: 1}, 
    textShadowRadius: 2 
  },
  
  loadingOverlay: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 10 },
  
  button: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 12 },
  closeButton: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },
  productDetail: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  detailValue: { fontSize: 16, color: '#1f2937', fontWeight: 'bold' },
  modalButton: { width: '100%', backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeModalButton: { backgroundColor: '#f3f4f6', marginTop: 12 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default ScannerScreen;