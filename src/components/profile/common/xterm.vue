<template>
  <div>
    <div id="xterm"></div>
  </div>
</template>

<script>
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
export default {
  name: 'Xterm',
  methods: {
    setTheme ({ foreground, background }) {
      this.term.setOption('theme', {
        foreground,
        background
      })
    }
  },
  mounted () {
    const term = new Terminal({
      fontSize: '13',
      rows: '5',
      padding: '15',
      fontFamily: 'Monaco,Consolas,monospace,Microsoft YaHei,Arial',
      disableStdin: true,
      theme: this.$store.state.preference.xtermTheme
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(document.getElementById('xterm'))
    fitAddon.fit()
    this.term = term

    const logs = [
      '2022-09-07T15:47:37.981+0800    ============ Build Start ============',
      '2022-09-07T15:47:37.981+0800    Checking Docker Connectivity.',
      '2022-09-07T15:47:38.017+0800    Check ended. Duration: 0.04 seconds.'
    ]
    logs.forEach(log => {
      this.term.write(log + '\r\n')
    })
  },
  destroyed () {
    this.term.clear()
  }
}
</script>
