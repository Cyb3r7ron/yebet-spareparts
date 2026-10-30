import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

// ==========================================
// HELPER FUNCTIONS & COMPONENTS (Outside Profile)
// ==========================================

const getAvatarUrl = (userData) => {
  if (userData?.avatarUrl) {
    return userData.avatarUrl.startsWith('http') ? userData.avatarUrl : `http://localhost:5000${userData.avatarUrl}`;
  }
  return `https://ui-avatars.com/api/?name=${userData?.firstName || 'U'}+${userData?.lastName || ''}&background=3b82f6&color=fff&size=128`;
};

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const PasswordInput = ({ label, value, onChange, show, setShow, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input 
        type={show ? "text" : "password"} 
        required 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-10 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
      />
      <button 
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        tabIndex={-1}
      >
        {show ? <EyeSlashIcon /> : <EyeIcon />}
      </button>
    </div>
  </div>
);

// ==========================================
// MAIN PROFILE COMPONENT
// ==========================================

const Profile = () => {
  const { user, token, updateUser } = useAuthStore();
  
  // Check if the user is a regular customer
  const isRegularUser = user?.role === 'USER';
  
  // Personal Info State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user));

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    
    // Only allow phone number updates for Admins/Managers
    if (!isRegularUser) {
      formData.append('phone', phone);
    }
    
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await axios.patch('/api/users/profile', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      
      updateUser(res.data.user);
      setFirstName(res.data.user.firstName);
      setLastName(res.data.user.lastName);
      setPhone(res.data.user.phone || '');
      setAvatarPreview(getAvatarUrl(res.data.user));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match!');
    }
    try {
      const res = await axios.patch('/api/users/password', { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      setCurrentPassword(''); 
      setNewPassword(''); 
      setConfirmPassword('');
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Personal Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          
          {/* Avatar Section (Conditional) */}
          <div className="flex items-center gap-6">
            <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
            
            {!isRegularUser ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Profile Picture</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700">Profile Picture</p>
                <p className="text-xs text-gray-500">Contact an administrator to update your profile picture.</p>
              </div>
            )}
          </div>

          {/* Names & Phone Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number 
                {isRegularUser && <span className="text-xs text-orange-600 font-normal ml-2">(Contact admin to change)</span>}
              </label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                readOnly={isRegularUser}
                className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                  isRegularUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`} 
                placeholder="e.g., +1 234 567 890" 
              />
            </div>
          </div>
          
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password Card (Available to everyone) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <PasswordInput 
            label="Current Password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            show={showCurrent} 
            setShow={setShowCurrent} 
            placeholder="Enter current password"
          />
          <PasswordInput 
            label="New Password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            show={showNew} 
            setShow={setShowNew} 
            placeholder="Enter new password"
          />
          <PasswordInput 
            label="Confirm New Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            show={showConfirm} 
            setShow={setShowConfirm} 
            placeholder="Confirm new password"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition mt-2">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;