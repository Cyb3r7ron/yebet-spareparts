import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('5');
  
  // Image States
  const [imageType, setImageType] = useState('url'); 
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUri, setLocalImageUri] = useState(null);
  const [localImageType, setLocalImageType] = useState('image/jpeg'); 
  
  const [loading, setLoading] = useState(false);

  const pickImage = async (source) => {
    try {
      if (source === 'gallery') {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.Images, // ✅ FIXED DEPRECATION WARNING
          allowsEditing: false, 
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setLocalImageUri(asset.uri);
          setLocalImageType(asset.mimeType || 'image/jpeg'); 
        }
      } else if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera permissions!');
          return;
        }
        let result = await ImagePicker.launchCameraAsync({
          allowsEditing: false, 
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setLocalImageUri(asset.uri);
          setLocalImageType(asset.mimeType || 'image/jpeg'); 
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

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
      if (imageType === 'upload' && localImageUri) {
        const formData = new FormData();
        
        // ✅ CRITICAL FIX: Android requires ALL FormData values to be STRINGS!
        // If we send numbers, Android drops them and the backend sees an empty body.
        formData.append('name', name);
        formData.append('sku', sku);
        formData.append('category', category);
        formData.append('price', parsedPrice.toString()); 
        formData.append('quantity', parsedQty.toString()); 
        formData.append('minStock', parsedMin.toString()); 
        
        formData.append('image', {
          uri: localImageUri,
          type: localImageType, 
          name: `${sku.replace(/\s+/g, '_')}.jpg`
        });

        await axios.post('/api/products', formData); 

      } else {
        await axios.post('/api/products', {
          name,
          sku,
          category,
          price: parsedPrice,
          quantity: parsedQty,
          minStock: parsedMin,
          imageUrl: imageUrl || null
        });
      }

      Alert.alert('Success!', `${name} has been added to inventory.`, [
        { text: 'OK', onPress: () => navigation.navigate('Inventory') }
      ]);
      
      // Reset form
      setName(''); setSku(''); setCategory(''); setPrice(''); setQuantity(''); 
      setImageUrl(''); setLocalImageUri(null); setLocalImageType('image/jpeg');

    } catch (error) {
      console.error('Add product error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to add product.';
      Alert.alert('Backend Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
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

          <View style={styles.card}>
            <Text style={styles.label}>Product Image</Text>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, imageType === 'url' && styles.toggleBtnActive]} 
                onPress={() => setImageType('url')}
              >
                <Text style={[styles.toggleText, imageType === 'url' && styles.toggleTextActive]}>🔗 Image Link</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, imageType === 'upload' && styles.toggleBtnActive]} 
                onPress={() => setImageType('upload')}
              >
                <Text style={[styles.toggleText, imageType === 'upload' && styles.toggleTextActive]}>📱 Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {imageType === 'url' && (
              <TextInput 
                style={styles.input} 
                value={imageUrl} 
                onChangeText={setImageUrl} 
                placeholder="https://example.com/image.jpg" 
                autoCapitalize="none"
              />
            )}

            {imageType === 'upload' && (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('camera')}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('gallery')}>
                  <Text style={styles.uploadIcon}>🖼️</Text>
                  <Text style={styles.uploadText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {(imageUrl || localImageUri) && (
              <View style={styles.previewContainer}>
                <Image 
                  source={{ uri: imageType === 'url' ? imageUrl : localImageUri }} 
                  style={styles.previewImage} 
                />
                <TouchableOpacity 
                  style={styles.clearImageBtn} 
                  onPress={() => { setImageUrl(''); setLocalImageUri(null); setLocalImageType('image/jpeg'); }}
                >
                  <Text style={styles.clearImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
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
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#2563eb' },

  uploadButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  uploadIcon: { fontSize: 18, marginRight: 8 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  previewContainer: { marginTop: 10, alignItems: 'center' },
  previewImage: { width: 150, height: 150, borderRadius: 12, backgroundColor: '#e5e7eb' },
  clearImageBtn: { position: 'absolute', top: -10, right: '35%', backgroundColor: '#ef4444', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  clearImageText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddProductScreen;