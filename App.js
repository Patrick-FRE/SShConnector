/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  TextField,
  FilledTextField,
  OutlinedTextField,
} from 'react-native-material-textfield';
import {SegmentedControls} from 'react-native-radio-buttons';

import SSHClient from 'react-native-ssh-sftp';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

let client;

class App extends React.Component {
  state = {
    host: '192.168.1.168',
    port: '22',
    username: 'nastia',
    password: '',
    selectedOption: 'Execute',
    privateKey: '',
    command: 'ls',
    exeOutput: '',
    shellOutput: '',
    sftpOutput: [],
    currentPath: '',
  };

  connect() {
    let {
      host,
      port,
      username,
      password,
      privateKey,
      selectedOption,
      command,
      exeClient,
      exeOutput,
      shellClient,
      shellOutput,
      sftpClient,
      sftpOutput,
    } = this.state;

    switch (selectedOption) {
      case 'Execute':
        if (!exeClient) {
          let exeClient = new SSHClient(
            host,
            parseInt(port),
            username,
            password.length > 0 ? password : {privateKey},
            error => {
              if (!error) {
                exeClient.execute(command, (error, output) => {
                  this.setState({exeClient, exeOutput: error ? error : output});
                });
              } else {
                this.setState({exeOutput: error});
              }
            },
          );
        } else {
          exeClient.execute(command, (error, output) => {
            this.setState({exeOutput: error ? error : output});
          });
        }
        break;
      case 'Shell':
        if (!shellClient) {
          let shellClient = new SSHClient(
            host,
            parseInt(port),
            username,
            password.length > 0 ? password : {privateKey},
            error => {
              if (!error) {
                this.setState({shellClient});
                shellClient.startShell('vanilla', error => {
                  if (error) this.setState({shellOutput: error});
                });
                shellClient.on('Shell', event => {
                  let {shellOutput} = this.state;
                  this.setState({shellOutput: shellOutput + event});
                });
              } else {
                this.setState({shellOutput: error});
              }
            },
          );
        }
        break;
      default:
        if (!sftpClient) {
          let sftpClient = new SSHClient(
            host,
            parseInt(port),
            username,
            password.length > 0 ? password : {privateKey},
            error => {
              if (!error) {
                this.setState({sftpClient});
                sftpClient.connectSFTP(error => {
                  if (error) {
                    console.warn(error);
                  } else {
                    this.listDirectory('.');
                    this.setState({currentPath: './'});

                    // sftpClient.sftpMkdir('testMkdir', (error) => {
                    //   if (error)
                    //     console.warn(error);
                    // });

                    // sftpClient.sftpRename('testMkdir', 'testRename', (error) => {
                    //   if (error)
                    //     console.warn(error);
                    // });

                    // sftpClient.sftpRmdir('testRename', (error) => {
                    //   if (error)
                    //     console.warn(error);
                    // });

                    // sftpClient.sftpRm('test', (error) => {
                    //   if (error)
                    //     console.warn(error);
                    // });

                    // sftpClient.sftpDownload('testUpload', '/storage/emulated/0', (error, response) => {
                    //   if (error)
                    //     console.warn(error);
                    //   if (response) {
                    //     console.warn(response);
                    //     sftpClient.sftpUpload(response, '.', (error) => {
                    //       if (error)
                    //         console.warn(error);
                    //     });
                    //   }
                    // });

                    // sftpClient.on('DownloadProgress', (event) => {
                    //   console.warn(event);
                    // });

                    // sftpClient.on('UploadProgress', (event) => {
                    //   console.warn(event);
                    // });
                  }
                });
              } else {
                console.warn(error);
              }
            },
          );
        }
    }
  }

  writeToShell(event) {
    let {shellClient, shellOutput} = this.state;
    if (shellClient) {
      shellClient.writeToShell(event.nativeEvent.text + '\n', error => {
        if (error) this.setState({shellOutput: shellOutput + error});
      });
    }
    this.textInput.clear();
  }

  enterDirectory(dir) {
    let {currentPath} = this.state;
    var newPath = currentPath + dir;
    this.setState({currentPath: newPath});
    this.listDirectory(newPath);
  }

  listDirectory(path) {
    let {sftpClient} = this.state;
    if (sftpClient) {
      sftpClient.sftpLs(path, (error, response) => {
        if (error) {
          console.warn(error);
        } else {
          this.setState({sftpOutput: response});
        }
      });
    }
  }

  goBack() {
    let {currentPath} = this.state;
    var newPath = currentPath.substring(
      0,
      currentPath.slice(0, -1).lastIndexOf('/') + 1,
    );
    this.setState({currentPath: newPath});
    this.listDirectory(newPath);
  }

  componentWillUnmount() {
    let {exeClient, shellClient, sftpClient} = this.state;
    if (exeClient) exeClient.disconnect();
    if (shellClient) shellClient.disconnect();
    if (sftpClient) sftpClient.disconnect();
  }

  render() {
    const options = ['Execute', 'Shell'];
    let {
      host,
      port,
      username,
      password,
      selectedOption,
      command,
      exeOutput,
      shellOutput,
      shellClient,
      sftpOutput,
      currentPath,
    } = this.state;
    return (
      <ScrollView
        style={styles.container}
        ref={ref => (this.scrollView = ref)}
        onContentSizeChange={(contentWidth, contentHeight) => {
          this.scrollView.scrollToEnd({animated: true});
        }}>
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 2, marginRight: 10}}>
            <TextField
              labelHeight={15}
              label="Host"
              value={host}
              onChangeText={host => this.setState({host})}
            />
          </View>
          <View style={{flex: 1}}>
            <TextField
              labelHeight={15}
              label="Port"
              value={port}
              onChangeText={port => this.setState({port})}
            />
          </View>
        </View>
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1, marginRight: 10}}>
            <TextField
              labelHeight={15}
              label="Username"
              value={username}
              onChangeText={username => this.setState({username})}
            />
          </View>
          <View style={{flex: 1}}>
            <TextField
              labelHeight={15}
              label="Password"
              value={password}
              onChangeText={password => this.setState({password})}
            />
          </View>
        </View>
        <View style={{marginTop: 10}} />
        <SegmentedControls
          options={options}
          onSelection={selectedOption => this.setState({selectedOption})}
          selectedOption={selectedOption}
        />
        {selectedOption === 'Execute' ? (
          <TextField
            labelHeight={20}
            label="Command"
            value={command}
            autoCapitalize="none"
            onChangeText={command => this.setState({command})}
          />
        ) : (
          <View style={{marginTop: 10}} />
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={this.connect.bind(this)}>
          <Text style={styles.buttonText}>
            {selectedOption === 'Execute' ? 'Run' : 'Connect'}
          </Text>
        </TouchableOpacity>
        {selectedOption === 'Execute' ? (
          <View style={styles.outputContainer}>
            <Text>{exeOutput}</Text>
          </View>
        ) : selectedOption === 'Shell' ? (
          <View style={styles.outputContainer}>
            <Text style={{fontSize: 12}}>{shellOutput}</Text>
            {shellClient ? (
              <TextInput
                underlineColorAndroid="transparent"
                ref={input => {
                  this.textInput = input;
                }}
                autoFocus={true}
                autoCapitalize="none"
                style={styles.shellInput}
                onSubmitEditing={this.writeToShell.bind(this)}
              />
            ) : undefined}
          </View>
        ) : undefined}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 5,
    padding: 20,
  },
  buttonText: {
    fontSize: 16,
    alignSelf: 'center',
    color: '#007AFF',
  },
  button: {
    height: 36,
    marginTop: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  outputContainer: {
    flex: 1,
    marginTop: 15,
    marginBottom: 20,
  },
  shellInput: {
    backgroundColor: '#eee',
    fontSize: 11,
    marginBottom: 20,
  },
  file: {
    padding: 4,
    color: 'grey',
  },
  directory: {
    padding: 4,
    color: 'black',
  },
});

export default App;
