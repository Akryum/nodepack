import semver from 'semver'
import consola from 'consola'

const leadRE = /^(~|\^|>=?)/
const rangeToVersion = (r: string) => r.replace(leadRE, '').replace(/x/g, '0')
const extractSemver = (r: string) => r.replace(/^.+#semver:/, '')
const injectSemver = (r: string, v: string) => semver.validRange(r) ? v : r.replace(/#semver:.+$/, `#semver:${v}`)

function tryGetNewerRange (r1: string, r2: string) {
  const v1 = rangeToVersion(r1)
  const v2 = rangeToVersion(r2)
  if (semver.valid(v1) && semver.valid(v2)) {
    return semver.gt(v1, v2) ? r1 : r2
  }
}

type StringMap = { [key: string]: string }

export function mergeDeps (id: string, to: StringMap, from: StringMap, sources: StringMap) {
  const res = Object.assign({}, to)
  for (const name in from) {
    const r1 = to[name]
    const r2 = from[name]
    const sourceMigrationId = sources[name]
    const isValidURI = r2.match(/^(?:file|git|git\+ssh|git\+http|git\+https|git\+file|https?):/) != null
    const isValidGitHub = r2.match(/^[^/]+\/[^/]+/) != null

    // if they are the same, do nothing. Helps when non semver type deps are used
    if (r1 === r2) continue

    if (!isValidGitHub && !isValidURI && !semver.validRange(r2)) {
      consola.warn(
        `invalid version range for dependency "${name}":\n\n` +
        `- ${r2} injected by migration "${id}"`,
      )
      continue
    }

    if (!r1) {
      res[name] = r2
      sources[name] = id
    } else {
      const r1semver = extractSemver(r1)
      const r2semver = extractSemver(r2)
      const r = tryGetNewerRange(r1semver, r2semver)
      const didGetNewer = !!r
      // if failed to infer newer version, use existing one because it's likely
      // built-in
      res[name] = didGetNewer ? injectSemver(r2, r) : r1
      // if changed, update source
      if (res[name] === r2) {
        sources[name] = id
      }
      // warn incompatible version requirements
      if (!semver.validRange(r1semver) || !semver.validRange(r2semver) || !semver.intersects(r1semver, r2semver)) {
        consola.warn(
          `conflicting versions for project dependency "${name}":\n\n` +
          `- ${r1} injected by migration "${sourceMigrationId}"\n` +
          `- ${r2} injected by migration "${id}"\n\n` +
          `Using ${didGetNewer ? `newer ` : ``}version (${res[name]}), but this may cause build errors.`,
        )
      }
    }
  }
  return res
}
