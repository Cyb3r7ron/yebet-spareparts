import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [imageUrl, setImageUrl] = useState(''); // ✅ Only Image URL
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !sku || !category || !price || !quantity) {
      Alert.alert('Missing Fields', 'Please fill in Name, SKU, Category, Price, and Quantity.');
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
      // ✅ Clean JSON request. No FormData, no Multer, no errors!
      await axios.post('/api/products', {
        name,
        sku,
        category,
        price: parsedPrice,
        quantity: parsedQty,
        minStock: parsedMin,
        imageUrl: imageUrl || null
      });

      Alert.alert('Success!', `${name} has been added to inventory.`, [
        { text: 'OK', onPress: () => navigation.navigate('Inventory') }
      ]);
      
      setName(''); setSku(''); setCategory(''); setPrice(''); setQuantity(''); setImageUrl('');

    } catch (error) {
      console.error('Add product error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add product.';
      Alert.alert('Backend Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Add New Part</Text>
            <Text style={styles.subtitle}>Fill in the details below</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Oil Filter" />

            <Text style={styles.label}>SKU *</Text>
            <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="e.g. OF-1234" autoCapitalize="characters" />

            <Text style={styles.label}>Category *</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Engine Parts" />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Price ($) *</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="number-pad" />
              </View>
            </View>

            <Text style={styles.label}>Min. Stock Alert</Text>
            <TextInput style={styles.input} value={minStock} onChangeText={setMinStock} placeholder="5" keyboardType="number-pad" />
          </View>

          {/* ✅ Clean Image URL Input */}
          <View style={styles.card}>
            <Text style={styles.label}>Product Image URL</Text>
            <TextInput 
              style={styles.input} 
              value={imageUrl} 
              onChangeText={setImageUrl} 
              placeholder="https://example.com/image.jpg" 
              autoCapitalize="none"
            />
            <Text style={styles.hint}>Paste a direct link to an image from the web.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Add to Inventory</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },

  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddProductScreen;