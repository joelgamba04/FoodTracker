// src/components/PrivacyPolicyModal.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/theme/color";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PrivacyPolicyModal = ({ visible, onClose }: Props) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.screen}>
        <AppHeader title="Privacy Policy" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            Patakaran sa Privacy Taguig NutriApp (Nutrition Monitoring
            Application)
          </Text>

          <Text style={styles.body}>
            Maligayang pagdating sa Taguig NutriApp (“Application”). Sa
            pag-download, pagrehistro, o paggamit ng Application na ito,
            sumasang-ayon ang Gumagamit na sumunod sa Patakaran sa Priivacy na
            nakasaad dito. Mangyaring basahin ang mga ito nang mabuti bago
            magpatuloy.
          </Text>

          <Text style={styles.section}>1. Layunin ng Application</Text>
          <Text style={styles.body}>
            Ang Taguig NutriApp ay idinisenyo upang tumulong sa pagsubaybay ng
            nutrisyon, kalusugan, at pang-araw-araw na aktibidad ng Gumagamit,
            gayundin sa pagbibigay ng mga rekomendasyon kaugnay sa tamang
            pagkain at hydration.
          </Text>

          <Text style={styles.section}>
            2. Saklaw ng Pagkolekta ng Impormasyon
          </Text>
          <Text style={styles.body}>
            Maaaring kolektahin ng application ang sumusunod na personal at
            sensitibong impormasyon mula sa Gumagamit:{"\n"}
            {"\n"}• Edad (Age) {"\n"}• Timbang (Weight) {"\n"}• Taas (Height){" "}
            {"\n"}• Araw-araw na konsumo ng pagkain (Daily Food Consumption)
            {"\n"}• Araw-araw na pag-inom ng tubig (Daily Water Intake) {"\n"}•
            Araw-araw na mga aktibidad (Daily Activities){"\n"}
            {"\n"}Ang pagbibigay ng naturang impormasyon ay boluntaryo, subalit
            kinakailangan upang magamit nang buo ang mga serbisyo ng
            application.
          </Text>

          <Text style={styles.section}>3. Layunin ng Pagproseso ng Datos</Text>
          <Text style={styles.body}>
            Ang mga nakolektang impormasyon ay gagamitin lamang para sa mga
            sumusunod na lehitimong layunin: {"\n"}
            {"\n"}• Pagsubaybay at pagtatasa ng nutrisyon at kalusugan ng
            Gumagamit. {"\n"}• Pagbibigay ng mga rekomendasyon sa tamang pagkain
            at hydration batay sa Nutrition and Dietetics Law (RA 10862){"\n"}•
            Pagtatalá at pagsusuri ng pang-araw-araw na aktibidad pangkalusugan.
            {"\n"}• Pagpapabuti ng serbisyo, features, at functionality ng
            Application
          </Text>

          <Text style={styles.section}>
            4. Paraan ng Pagproseso at Seguridad
          </Text>
          <Text style={styles.body}>
            Ang lahat ng personal na datos ay ipoproseso alinsunod sa mga
            prinsipyo ng transparency, legitimate purpose, at proportionality.
            {"\n"}
            {"\n"}Nagpapatupad ang application ng angkop na: {"\n"}
            {"\n"}• Teknikal na hakbang (hal. encryption, secure storage) {"\n"}
            • Administratibong hakbang (hal. access control policies) {"\n"}
            {"\n"}Upang maprotektahan ang datos laban sa hindi awtorisadong
            access, paggamit, pagbabago, o pagkawala.
          </Text>

          <Text style={styles.section}>
            5. Pagbabahagi at Pagbubunyag ng Datos
          </Text>
          <Text style={styles.body}>
            Ang personal na impormasyon ng Gumagamit ay hindi ibabahagi,
            ililipat, o isisiwalat sa anumang ikatlong partido , maliban sa mga
            sumusunod na pagkakataon: {"\n"}
            {"\n"}• Kung kinakailangan para sa wastong operasyon, pagpapanatili,
            at pagpapabuti ng application; {"\n"}• Kung may malinaw at hayagang
            pahintulot ng Gumagamit; {"\n"}• Kung gagamitin sa pagtakda ng mga
            policy, pagdevelop ng mga programa, at pagpaplano ng Pamahalaang
            Lungsod Taguig kaugnay ng kalusugan at nutrisyon; {"\n"}• Kung
            hinihingi o pinahihintulutan ng umiiral na batas, regulasyon, o
            lehitimong kautusan ng isang awtorisadong ahensya o hukuman.{"\n"}
          </Text>

          <Text style={styles.section}>6. Panahon ng Pag-iingat ng Datos</Text>
          <Text style={styles.body}>
            Ang personal na datos ay itatago lamang sa loob ng panahong
            kinakailangan upang matupad ang mga layuning nakasaad sa Kasunduang
            ito. {"\n"}
            {"\n"}Pagkatapos nito, ang datos ay ligtas na buburahin, ide-delete,
            o ia-anonymize upang hindi na makilala ang Gumagamit.
          </Text>

          <Text style={styles.section}>7. Mga Karapatan ng Gumagamit</Text>
          <Text style={styles.body}>
            Ang Gumagamit ay may karapatan, alinsunod sa umiiral na batas, na:
            {"\n"}
            {"\n"}• Maipabatid kung paano ginagamit ang kanilang datos;{"\n"}•
            Ma-access ang kanilang personal na impormasyon;{"\n"}• Iwasto o
            mag-update ng maling datos;{"\n"}• Humiling ng pagbura o pag-block
            ng datos kung naaangkop;{"\n"}• Tutulan ang pagproseso ng datos,
            kung naaangkop.{"\n"}
            {"\n"}Maaaring gamitin ng Gumagamit ang mga karapatang ito sa
            pamamagitan ng pakikipag-ugnayan sa administrador ng application.
          </Text>

          <Text style={styles.section}>8. Pahintulot at Pagtanggap</Text>
          <Text style={styles.body}>
            Sa pag-download, pag-access, o patuloy na paggamit ng Taguig
            NutriApp, kinikilala ng Gumagamit na: {"\n"}
            {"\n"}• Nabasa at naunawaan niya ang Patakaran sa Privacy; at{"\n"}•
            Kusang-loob siyang nagbibigay ng malinaw at hayagang pahintulot sa
            pagkolekta, paggamit, at pagproseso ng kanyang personal na datos
            alinsunod sa mga nakasaad dito.
          </Text>

          <Text style={styles.section}>
            9. Pagbabago ng Patakaran sa Privacy{" "}
          </Text>
          <Text style={styles.body}>
            Maaaring baguhin o i-update ang Patakaran sa Privacy anumang oras.
            Ang patuloy na paggamit ng application matapos ang pagbabago ay
            ituturing na pagtanggap ng Gumagamit sa mga binagong patakaran.
            WAKAS
          </Text>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.textInverse,
    fontWeight: "900",
    fontSize: 15,
  },
});

export default PrivacyPolicyModal;
