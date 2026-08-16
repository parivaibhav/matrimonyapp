// import React, { useState } from "react";
// import {
//   Alert,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as ImagePicker from "expo-image-picker";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { api } from "../api";
// import { colors, shadow } from "../theme";
// import { useResponsiveLayout } from "../utils/responsive";

// const fields = [
//   ["fullName", "Full name"],
//   ["age", "Age"],
//   ["phone", "Phone number"],
//   ["email", "Email"],
//   ["password", "Password"],
//   ["education", "Education"],
//   ["occupation", "Occupation"],
//   ["city", "City"],
//   ["height", "Height"],
//   ["religion", "Religion"],
//   ["community", "Community"],
//   ["familyDetails", "Family details"],
//   ["bio", "Short bio"],
//   ["interests", "Interests (comma separated)"],
// ];

// // Helper pairs for 2-column grid layout on tablet screens
// const tabletFieldPairs = [
//   [["fullName", "Full name"], ["age", "Age"]],
//   [["phone", "Phone number"], ["email", "Email"]],
//   [["password", "Password"], ["city", "City"]],
//   [["education", "Education"], ["occupation", "Occupation"]],
//   [["height", "Height"], ["religion", "Religion"]],
//   [["community", "Community"], ["interests", "Interests (comma separated)"]],
//   [["familyDetails", "Family details"]],
//   [["bio", "Short bio"]],
// ];

// export default function SignupScreen({ navigation }) {
//   const [form, setForm] = useState({
//     gender: "Male",
//   });

//   const [photo, setPhoto] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const { isSmallPhone, isTablet } = useResponsiveLayout();

//   const set = (key, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [key]: value,
//     }));
//   };

//   async function choosePhoto() {
//     try {
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (!permission.granted) {
//         Alert.alert(
//           "Permission required",
//           "Please allow photo access to select a profile photo."
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ["images"],
//         quality: 0.8,
//         allowsEditing: true,
//         aspect: [1, 1],
//       });

//       if (!result.canceled && result.assets?.length > 0) {
//         setPhoto(result.assets[0]);
//       }
//     } catch (error) {
//       console.log("IMAGE PICKER ERROR:", error);
//       Alert.alert("Error", "Could not select the image.");
//     }
//   }

//   async function signup() {
//     if (
//       !form.fullName?.trim() ||
//       !form.age ||
//       !form.phone?.trim() ||
//       !form.email?.trim() ||
//       !form.password
//     ) {
//       Alert.alert(
//         "Required",
//         "Please enter name, age, phone, email and password."
//       );
//       return;
//     }

//     const age = Number(form.age);
//     if (Number.isNaN(age) || age < 18) {
//       Alert.alert("Invalid age", "You must be at least 18 years old.");
//       return;
//     }

//     if (form.password.length < 6) {
//       Alert.alert(
//         "Invalid password",
//         "Password must contain at least 6 characters."
//       );
//       return;
//     }

//     try {
//       setLoading(true);

//       const body = new FormData();
//       Object.entries(form).forEach(([key, value]) => {
//         body.append(key, String(value ?? ""));
//       });

//       if (photo?.uri) {
//         const filename =
//           photo.fileName || photo.uri.split("/").pop() || "profile.jpg";
//         const type = photo.mimeType || "image/jpeg";

//         body.append("profilePhoto", {
//           uri: photo.uri,
//           name: filename,
//           type: type,
//         });
//       }

//       const response = await api.post("/auth/signup", body);
//       const { token, user } = response.data;

//       if (!token) {
//         throw new Error("Backend did not return authentication token.");
//       }

//       await AsyncStorage.setItem("token", token);
//       await AsyncStorage.setItem("user", JSON.stringify(user));

//       Alert.alert(
//         "Account created",
//         "Your profile has been created successfully.",
//         [
//           {
//             text: "Continue",
//             onPress: () => {
//               navigation.goBack();
//             },
//           },
//         ]
//       );
//     } catch (error) {
//       let message = "Unable to create account.";
//       if (error.response?.data?.message) {
//         message = error.response.data.message;
//       } else if (error.message === "Network Error") {
//         message = "Cannot connect to backend server.";
//       } else if (error.message) {
//         message = error.message;
//       }
//       Alert.alert("Signup failed", message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   const renderInputField = ([key, placeholder]) => (
//     <TextInput
//       key={key}
//       style={[
//         styles.input,
//         (key === "bio" || key === "familyDetails") && styles.multiline,
//         isTablet && key !== "bio" && key !== "familyDetails" && { marginBottom: 0 },
//       ]}
//       placeholder={placeholder}
//       placeholderTextColor={colors.muted}
//       value={form[key] || ""}
//       onChangeText={(value) => set(key, value)}
//       secureTextEntry={key === "password"}
//       multiline={key === "bio" || key === "familyDetails"}
//       keyboardType={
//         key === "age"
//           ? "numeric"
//           : key === "phone"
//           ? "phone-pad"
//           : key === "email"
//           ? "email-address"
//           : "default"
//       }
//       autoCapitalize={
//         key === "email" ? "none" : key === "password" ? "none" : "sentences"
//       }
//     />
//   );

//   return (
//     <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <ScrollView
//           style={styles.screen}
//           contentContainerStyle={styles.container}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={[styles.card, isTablet && styles.tabletCard]}>
//             <Text style={[styles.title, isSmallPhone && { fontSize: 24 }]}>
//               Create your profile
//             </Text>
//             <Text style={styles.subtitle}>
//               Add a few details to help others discover you.
//             </Text>

//             {/* Profile photo */}
//             <Pressable style={styles.photoBox} onPress={choosePhoto}>
//               {photo?.uri ? (
//                 <Image source={{ uri: photo.uri }} style={styles.photo} />
//               ) : (
//                 <Text style={styles.photoText}>+ Add Profile Photo</Text>
//               )}
//             </Pressable>

//             {/* Gender */}
//             <Text style={styles.label}>Gender</Text>
//             <View style={styles.genderRow}>
//               <Pressable
//                 style={[
//                   styles.gender,
//                   form.gender === "Male" && styles.selected,
//                   { flex: 1 },
//                 ]}
//                 onPress={() => set("gender", "Male")}
//               >
//                 <Text
//                   style={[
//                     styles.genderText,
//                     form.gender === "Male" && styles.selectedText,
//                   ]}
//                 >
//                   Male
//                 </Text>
//               </Pressable>

//               <Pressable
//                 style={[
//                   styles.gender,
//                   form.gender === "Female" && styles.selected,
//                   { flex: 1 },
//                 ]}
//                 onPress={() => set("gender", "Female")}
//               >
//                 <Text
//                   style={[
//                     styles.genderText,
//                     form.gender === "Female" && styles.selectedText,
//                   ]}
//                 >
//                   Female
//                 </Text>
//               </Pressable>
//             </View>

//             {/* Render fields (2-columns on tablet, single column on phone) */}
//             {isTablet
//               ? tabletFieldPairs.map((pair, idx) => (
//                   <View key={idx} style={styles.fieldRow}>
//                     {pair.map(([key, placeholder]) => (
//                       <View key={key} style={{ flex: 1 }}>
//                         {renderInputField([key, placeholder])}
//                       </View>
//                     ))}
//                   </View>
//                 ))
//               : fields.map((field) => renderInputField(field))}

//             {/* Signup button */}
//             <Pressable
//               style={[styles.button, loading && styles.buttonDisabled]}
//               onPress={signup}
//               disabled={loading}
//             >
//               <Text style={styles.buttonText}>
//                 {loading ? "Creating..." : "Create Profile"}
//               </Text>
//             </Pressable>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: colors.bg,
//   },
//   container: {
//     padding: 20,
//     paddingBottom: 50,
//   },
//   card: {
//     width: "100%",
//     maxWidth: 680,
//     alignSelf: "center",
//   },
//   tabletCard: {
//     backgroundColor: "#fff",
//     padding: 32,
//     borderRadius: 24,
//     ...shadow,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "900",
//     color: colors.text,
//   },
//   subtitle: {
//     color: colors.muted,
//     marginVertical: 8,
//     lineHeight: 20,
//     fontSize: 15,
//   },
//   photoBox: {
//     height: 160,
//     borderRadius: 20,
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: colors.border,
//     marginVertical: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     overflow: "hidden",
//   },
//   photo: {
//     width: "100%",
//     height: "100%",
//   },
//   photoText: {
//     color: colors.primary,
//     fontWeight: "800",
//     fontSize: 15,
//   },
//   label: {
//     fontWeight: "700",
//     marginBottom: 8,
//     color: colors.text,
//     fontSize: 15,
//   },
//   genderRow: {
//     flexDirection: "row",
//     gap: 12,
//     marginBottom: 16,
//   },
//   gender: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: colors.border,
//     alignItems: "center",
//   },
//   selected: {
//     borderColor: colors.primary,
//     backgroundColor: "#EFF6FF",
//   },
//   genderText: {
//     color: colors.text,
//     fontWeight: "600",
//   },
//   selectedText: {
//     color: colors.primary,
//     fontWeight: "800",
//   },
//   fieldRow: {
//     flexDirection: "row",
//     gap: 14,
//     marginBottom: 14,
//   },
//   input: {
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: colors.border,
//     padding: 14,
//     borderRadius: 13,
//     marginBottom: 11,
//     fontSize: 16,
//     color: colors.text,
//   },
//   multiline: {
//     minHeight: 90,
//     textAlignVertical: "top",
//   },
//   button: {
//     backgroundColor: colors.primary,
//     padding: 16,
//     borderRadius: 14,
//     alignItems: "center",
//     marginTop: 16,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "800",
//     fontSize: 16,
//   },
// });
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "../api";
import { colors, shadow } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { isSmallPhone, isTablet } = useResponsiveLayout();

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  async function signup() {
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    // Required validation
    if (!email || !password || !confirmPassword) {
      Alert.alert(
        "Required",
        "Please enter your email, password and re-type password.",
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must contain at least 6 characters.",
      );
      return;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      Alert.alert(
        "Password mismatch",
        "Password and re-type password do not match.",
      );
      return;
    }

    try {
      setLoading(true);

      // Do NOT send confirmPassword to backend
      const body = {
        email,
        password,
      };

      const response = await api.post("/auth/signup", body);

      const { token, user } = response.data;

      if (!token) {
        throw new Error("Backend did not return authentication token.");
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      Alert.alert(
        "Account created",
        "Your account has been created successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.log("SIGNUP ERROR:", error);

      let message = "Unable to create account.";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === "Network Error") {
        message = "Cannot connect to backend server.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert("Signup failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isTablet && styles.tabletCard]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, isSmallPhone && { fontSize: 25 }]}>
                Create your account
              </Text>

              <Text style={styles.subtitle}>
                Enter your email and create a secure password.
              </Text>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.muted}
                value={form.email}
                onChangeText={(value) => set("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={colors.muted}
                  value={form.password}
                  onChangeText={(value) => set("password", value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Pressable
                  style={styles.showButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Text style={styles.showText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.helperText}>
                Password must contain at least 6 characters.
              </Text>
            </View>

            {/* Re-type Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Re-type Password</Text>

              <View
                style={[
                  styles.passwordContainer,
                  form.confirmPassword.length > 0 &&
                    form.password !== form.confirmPassword &&
                    styles.errorBorder,
                  form.confirmPassword.length > 0 &&
                    form.password === form.confirmPassword &&
                    styles.successBorder,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.muted}
                  value={form.confirmPassword}
                  onChangeText={(value) => set("confirmPassword", value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Pressable
                  style={styles.showButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Text style={styles.showText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>

              {form.confirmPassword.length > 0 &&
                form.password !== form.confirmPassword && (
                  <Text style={styles.errorText}>Passwords do not match.</Text>
                )}

              {form.confirmPassword.length > 0 &&
                form.password === form.confirmPassword && (
                  <Text style={styles.successText}>Passwords match.</Text>
                )}
            </View>

            {/* Signup Button */}
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating account..." : "Create Account"}
              </Text>
            </Pressable>

            {/* Login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>

              <Pressable onPress={() => navigation.goBack()} disabled={loading}>
                <Text style={styles.loginLink}> Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  tabletCard: {
    backgroundColor: "#fff",
    padding: 34,
    borderRadius: 24,
    ...shadow,
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },

  passwordContainer: {
    height: 54,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },

  showButton: {
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
  },

  showText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  helperText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 7,
  },

  errorBorder: {
    borderColor: "#EF4444",
  },

  successBorder: {
    borderColor: "#22C55E",
  },

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 7,
  },

  successText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 7,
  },

  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  loginText: {
    color: colors.muted,
    fontSize: 14,
  },

  loginLink: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
});
