import test from "node:test";
import assert from "node:assert/strict";
import {
  candidates,
  makeAnalysisRequest,
} from "../dist/mira-templates/candidates.js";
test("both management roles can prepare an analysis, ordinary users cannot", () => {
  for (const role of ["admin", "superadmin"]) {
    const request = makeAnalysisRequest(
      candidates[0],
      "只保留短暂睡衣开场",
      role,
    );
    assert.equal(request.operatorInstruction, "只保留短暂睡衣开场");
    assert.equal(request.publicationStatus, "not_published");
    assert.equal(request.status, "pending_backend");
    assert.equal(request.modelPolicy.allowLite, false);
    assert.equal(request.sourceUrl, candidates[0].url);
  }
  assert.throws(() => makeAnalysisRequest(candidates[0], "", "user"));
});
test("revised instruction replaces previous input and has no downstream author inspiration", () => {
  const first = makeAnalysisRequest(candidates[0], "a", "admin");
  const next = makeAnalysisRequest(candidates[0], " b ", "admin");
  assert.equal(first.operatorInstruction, "a");
  assert.equal(next.operatorInstruction, "b");
  assert(!("authorInspiration" in next));
  assert.equal(next.sourceMediaStatus, "requires-authorized-video-ingest");
});
