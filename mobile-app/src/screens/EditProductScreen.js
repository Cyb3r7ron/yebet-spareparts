import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const EditProductScreen = ({ route, navigation }) => {
  // Get the product data passed from the Inventory screen
  const initialProduct = route.params.product;

  // Pre-fill the states with the existing product data
  const [name, setName] = useState(initialProduct.name || '');
  const [sku, setSku] = useState(initialProduct.sku || '');
  const [category, setCategory] = useState(initialProduct.category || '');
  const [price, setPrice] = useState(initialProduct.price?.toString() || '');
  const [quantity, setQuantity] = useState(initialProduct.quantity?.toString() || '');
  const [minStock, setMinStock] = useState(initialProduct.minStock?.toString() || '5');
  const [imageUrl, setImageUrl] = useState(initialProduct.imageUrl || '');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !sku || !category || !price || !quantity) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQty = parseInt(quantity);
    const parsedMin = parseInt(minStock) || 5;

    if (isNaN(parsedPrice) || isNaN(parsedQty)) {
      Alert.alert('Invalid Numbers', 'Please enter valid numbers for Price and Quantity.');
      return;
    }

    setLoading(true);
    try {
      // ✅ UPDATE REQUEST (PUT) instead of POST
      await axios.put(`/api/products/${initialProduct.id}`, {
        name,
        sku,
        category,
        price: parsedPrice,
        quantity: parsedQty,
        minStock: parsedMin,
        imageUrl: imageUrl || null
      });

      Alert.alert('Success!', `${name} has been updated.`, [
        { text: 'OK', onPress: () => navigation.goBack() } // Go back to Inventory
      ]);

    } catch (error) {
      console.error('Edit product error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update product.';
      Alert.alert('Backend Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Edit Part</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>SKU *</Text>
            <TextInput style={styles.input} value={sku} onChangeText={setSku} autoCapitalize="characters" />

            <Text style={styles.label}>Category *</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Price ($) *</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
              </View>
            </View>

            <Text style={styles.label}>Min. Stock Alert</Text>
            <TextInput style={styles.input} value={minStock} onChangeText={setMinStock} keyboardType="number-pad" />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Product Image URL</Text>
            <TextInput 
              style={styles.input} 
              value={imageUrl} 
              onChangeText={setImageUrl} 
              placeholder="https://example.com/image.jpg" 
              autoCapitalize="none"
            />
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.previewImage} />
            ) : (
              <View style={styles.noImageBox}><Text style={{color: '#9ca3af'}}>No image</Text></View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Changes</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 16 },
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },

  previewImage: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#e5e7eb', marginTop: 10 },
  noImageBox: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginTop: 10 },

  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default EditProductScreen;