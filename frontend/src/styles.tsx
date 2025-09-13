import { StyleSheet } from 'react-native';
import { Colors } from 'react-native-native-ui';

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        marginBottom: 10,
    },
    subtitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    cardContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    card: {
        width: '45%',
        margin: 5,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: {
        textAlign: 'center',
    },
});
